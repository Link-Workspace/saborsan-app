const { app } = require('@azure/functions');
const sql = require('mssql');

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

app.http('history', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const deviceId = request.query.get('deviceId');

      if (!deviceId) {
        return { status: 400, jsonBody: { error: 'deviceId é obrigatório' } };
      }

      await sql.connect(sqlConfig);

      const result = await sql.query`
        SELECT role, content, createdAt
        FROM Messages
        WHERE deviceId = ${deviceId}
        ORDER BY createdAt ASC
      `;

      return { jsonBody: { messages: result.recordset } };
    } catch (error) {
      context.error('Erro na função history:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
