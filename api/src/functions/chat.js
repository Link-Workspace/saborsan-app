const { app } = require('@azure/functions');
const { OpenAI } = require('openai');
const sql = require('mssql');
const { uploadAudio } = require('../storage');

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

// Cache da voz do agente ElevenLabs
let cachedVoiceId = null;

async function getAgentVoiceId() {
  if (cachedVoiceId) return cachedVoiceId;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`,
    { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
  );
  const data = await res.json();
  cachedVoiceId = data.conversation_config?.tts?.voice_id;
  return cachedVoiceId;
}

async function generateAudio(text) {
  const voiceId = await getAgentVoiceId();
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

const BASE_SYSTEM_PROMPT = `Você é um vendedor virtual da Saborsan, empresa especializada em produtos alimentícios como salgados, pães de queijo, croissants e açaís.

Seu objetivo é ajudar o cliente a conhecer os produtos, tirar dúvidas e orientar sobre como fazer pedidos.

Seja simpático, objetivo e profissional. Quando relevante, pergunte o nome do cliente para personalizar o atendimento.

Se o cliente quiser fazer um pedido ou precisar de informações específicas da conta dele, informe que ele pode fazer login para facilitar o processo.

Use as informações dos produtos abaixo para responder com precisão sobre o catálogo atual:

{PRODUCTS}`;

function buildSystemPrompt(products) {
  if (!products.length) return BASE_SYSTEM_PROMPT.replace('{PRODUCTS}', 'Catálogo temporariamente indisponível.');
  const list = products.map((p) =>
    `- ${p.name} (${p.category}): ${p.description}. Embalagem: ${p.packaging}. Conservação: ${p.conservation}. Preparo: ${p.preparation}. Ideal para: ${p.idealFor}. Preço: ${p.price}. Quantidade disponível: ${p.availableQuantity}.`
  ).join('\n');
  return BASE_SYSTEM_PROMPT.replace('{PRODUCTS}', list);
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

      const [productsResult, historyResult] = await Promise.all([
        sql.query`SELECT name, category, description, packaging, conservation, preparation, idealFor, price, availableQuantity FROM Products WHERE active = 1`,
        sql.query`SELECT TOP 10 role, content FROM Messages WHERE deviceId = ${deviceId} ORDER BY createdAt DESC`,
      ]);

      const history = historyResult.recordset.reverse().map(row => ({
        role: row.role,
        content: row.content,
      }));

      const messages = [
        { role: 'system', content: buildSystemPrompt(productsResult.recordset) },
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

      // Gerar áudio quando a resposta for uma explicação longa (> 280 chars)
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

      // Atualizar registro com audioUrl se gerado
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

const BASE_SYSTEM_PROMPT = `Você é um vendedor virtual da Saborsan, empresa especializada em produtos alimentícios como salgados, pães de queijo, croissants e açaís.

Seu objetivo é ajudar o cliente a conhecer os produtos, tirar dúvidas e orientar sobre como fazer pedidos.

Seja simpático, objetivo e profissional. Quando relevante, pergunte o nome do cliente para personalizar o atendimento.

Se o cliente quiser fazer um pedido ou precisar de informações específicas da conta dele, informe que ele pode fazer login para facilitar o processo.

Use as informações dos produtos abaixo para responder com precisão sobre o catálogo atual:

{PRODUCTS}`;

function buildSystemPrompt(products) {
  if (!products.length) return BASE_SYSTEM_PROMPT.replace('{PRODUCTS}', 'Catálogo temporariamente indisponível.');
  const list = products.map((p) =>
    `- ${p.name} (${p.category}): ${p.description}. Embalagem: ${p.packaging}. Conservação: ${p.conservation}. Preparo: ${p.preparation}. Ideal para: ${p.idealFor}. Preço: ${p.price}. Quantidade disponível: ${p.availableQuantity}.`
  ).join('\n');
  return BASE_SYSTEM_PROMPT.replace('{PRODUCTS}', list);
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { deviceId, message } = body;

      if (!deviceId || !message) {
        return { status: 400, jsonBody: { error: 'deviceId e message são obrigatórios' } };
      }

      await sql.connect(sqlConfig);

      // Buscar produtos e histórico em paralelo
      const [productsResult, historyResult] = await Promise.all([
        sql.query`SELECT name, category, description, packaging, conservation, preparation, idealFor, price, availableQuantity FROM Products WHERE active = 1`,
        sql.query`SELECT TOP 10 role, content FROM Messages WHERE deviceId = ${deviceId} ORDER BY createdAt DESC`,
      ]);

      const history = historyResult.recordset.reverse().map(row => ({
        role: row.role,
        content: row.content,
      }));

      const messages = [
        { role: 'system', content: buildSystemPrompt(productsResult.recordset) },
        ...history,
        { role: 'user', content: message },
      ];

      // Salvar mensagem do usuário
      await sql.query`
        INSERT INTO Messages (deviceId, role, content, createdAt)
        VALUES (${deviceId}, 'user', ${message}, GETUTCDATE())
      `;

      // Chamar OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Salvar resposta do assistente
      await sql.query`
        INSERT INTO Messages (deviceId, role, content, createdAt)
        VALUES (${deviceId}, 'assistant', ${assistantMessage}, GETUTCDATE())
      `;

      return { jsonBody: { message: assistantMessage } };
    } catch (error) {
      context.error('Erro na função chat:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
