const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('feedback', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { email, content, userId } = await request.json();

      if (!email || !content) {
        return { status: 400, jsonBody: { error: 'email e conteúdo são obrigatórios' } };
      }

      await sql.connect(sqlConfig);

      await sql.query`
        INSERT INTO Feedback (email, content, userId, createdAt)
        VALUES (${email}, ${content}, ${userId || null}, GETUTCDATE())
      `;

      return { jsonBody: { success: true } };
    } catch (error) {
      context.error('Erro na função feedback:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
