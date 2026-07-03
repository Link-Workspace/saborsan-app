const { app } = require('@azure/functions');
const { OpenAI } = require('openai');
const sql = require('mssql');
const { uploadAudio } = require('../storage');
const { getAgentConfig } = require('../elevenlabs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const FALLBACK_PROMPT = `Você é um vendedor virtual da Saborsan, empresa especializada em produtos alimentícios. Seja simpático, objetivo e profissional.`;

async function getVoiceId() {
  const config = await getAgentConfig();
  return config.voiceId;
}

async function generateAudio(text) {
  const voiceId = await getVoiceId();
  if (!voiceId) return null;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) return null;
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

function buildSystemPrompt(agentPrompt, products) {
  const base = agentPrompt || FALLBACK_PROMPT;
  if (!products.length) return `${base}\n\nCatálogo: temporariamente indisponível.`;
  const list = products.map((p) =>
    `- ${p.name} (${p.category}): ${p.description}. Embalagem: ${p.packaging}. Conservação: ${p.conservation}. Preparo: ${p.preparation}. Ideal para: ${p.idealFor}. Preço: ${p.price}. Quantidade disponível: ${p.availableQuantity}.`
  ).join('\n');
  return `${base}\n\nUse as informações do catálogo abaixo para responder com precisão:\n${list}`;
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { deviceId, message, audioUrl: clientAudioUrl } = body;

      if (!deviceId || !message) {
        return { status: 400, jsonBody: { error: 'deviceId e message são obrigatórios' } };
      }

      await sql.connect(sqlConfig);

      const [productsResult, historyResult, agentConfig] = await Promise.all([
        sql.query`SELECT name, category, description, packaging, conservation, preparation, idealFor, price, availableQuantity FROM Products WHERE active = 1`,
        sql.query`SELECT TOP 10 role, content FROM Messages WHERE deviceId = ${deviceId} ORDER BY createdAt DESC`,
        getAgentConfig(),
      ]);

      const history = historyResult.recordset.reverse().map(row => ({
        role: row.role,
        content: row.content,
      }));

      const messages = [
        { role: 'system', content: buildSystemPrompt(agentConfig.prompt, productsResult.recordset) },
        ...history,
        { role: 'user', content: message },
      ];

      await sql.query`
        INSERT INTO Messages (deviceId, role, content, audioUrl, createdAt)
        VALUES (${deviceId}, 'user', ${message}, ${clientAudioUrl || null}, GETUTCDATE())
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message.content;

      await sql.query`
        INSERT INTO Messages (deviceId, role, content, createdAt)
        VALUES (${deviceId}, 'assistant', ${assistantMessage}, GETUTCDATE())
      `;

      let audio = null;
      let audioUrl = null;
      if (assistantMessage.length > 280) {
        try {
          const audioBase64 = await generateAudio(assistantMessage);
          if (audioBase64) {
            audio = audioBase64;
            const buffer = Buffer.from(audioBase64, 'base64');
            audioUrl = await uploadAudio(buffer, 'audio/mpeg', 'audio-vendedor');
          }
        } catch (err) {
          context.warn('Falha ao gerar áudio:', err);
        }
      }

      if (audioUrl) {
        await sql.query`
          UPDATE Messages SET audioUrl = ${audioUrl}
          WHERE deviceId = ${deviceId} AND role = 'assistant'
          AND createdAt = (SELECT MAX(createdAt) FROM Messages WHERE deviceId = ${deviceId} AND role = 'assistant')
        `;
      }

      return { jsonBody: { message: assistantMessage, ...(audio ? { audio } : {}) } };
    } catch (error) {
      context.error('Erro na função chat:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
