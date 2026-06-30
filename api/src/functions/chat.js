const { app } = require('@azure/functions');
const { OpenAI } = require('openai');
const sql = require('mssql');

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

const SYSTEM_PROMPT = `Você é um vendedor virtual da Saborsan, empresa especializada em produtos alimentícios como salgados, pães de queijo, croissants e açaís.

Seu objetivo é ajudar o cliente a conhecer os produtos, tirar dúvidas e orientar sobre como fazer pedidos.

Seja simpático, objetivo e profissional. Quando relevante, pergunte o nome do cliente para personalizar o atendimento.

Se o cliente quiser fazer um pedido ou precisar de informações específicas da conta dele, informe que ele pode fazer login para facilitar o processo.`;

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

      // Buscar histórico recente da conversa (últimas 10 mensagens)
      const historyResult = await sql.query`
        SELECT TOP 10 role, content
        FROM Messages
        WHERE deviceId = ${deviceId}
        ORDER BY createdAt DESC
      `;

      const history = historyResult.recordset.reverse().map(row => ({
        role: row.role,
        content: row.content,
      }));

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
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
