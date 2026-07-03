const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('save-transcript', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { deviceId, messages } = body;

      if (!deviceId || !Array.isArray(messages) || messages.length === 0) {
        return { status: 400, jsonBody: { error: 'deviceId e messages são obrigatórios' } };
      }

      await sql.connect(sqlConfig);

      for (const msg of messages) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        await sql.query`
          INSERT INTO Messages (deviceId, role, content, createdAt)
          VALUES (${deviceId}, ${role}, ${msg.content}, GETUTCDATE())
        `;
      }

      return { jsonBody: { success: true } };
    } catch (error) {
      context.error('Erro na função save-transcript:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
