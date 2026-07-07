const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('register-token', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { deviceId, userId, token } = await request.json();
      if (!deviceId || !token) return { status: 400, jsonBody: { error: 'deviceId e token são obrigatórios' } };

      await sql.connect(sqlConfig);
      await sql.query`
        MERGE PushTokens AS target
        USING (SELECT ${deviceId} AS deviceId) AS source ON target.deviceId = source.deviceId
        WHEN MATCHED THEN UPDATE SET token = ${token}, userId = ${userId || null}, updatedAt = GETUTCDATE()
        WHEN NOT MATCHED THEN INSERT (deviceId, userId, token) VALUES (${deviceId}, ${userId || null}, ${token});
      `;
      return { jsonBody: { success: true } };
    } catch (error) {
      context.error('Erro em register-token:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
