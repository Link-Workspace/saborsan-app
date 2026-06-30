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

app.http('link-user', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { deviceId, userId } = body;

      if (!deviceId || !userId) {
        return { status: 400, jsonBody: { error: 'deviceId e userId são obrigatórios' } };
      }

      await sql.connect(sqlConfig);

      // Vincula o userId a todas as mensagens desse deviceId
      await sql.query`
        UPDATE Messages
        SET userId = ${userId}
        WHERE deviceId = ${deviceId}
      `;

      // Registra o vínculo na tabela de sessões
      await sql.query`
        MERGE Sessions AS target
        USING (SELECT ${deviceId} AS deviceId, ${userId} AS userId) AS source
        ON target.deviceId = source.deviceId
        WHEN MATCHED THEN
          UPDATE SET userId = source.userId, updatedAt = GETUTCDATE()
        WHEN NOT MATCHED THEN
          INSERT (deviceId, userId, createdAt, updatedAt)
          VALUES (source.deviceId, source.userId, GETUTCDATE(), GETUTCDATE());
      `;

      return { jsonBody: { success: true } };
    } catch (error) {
      context.error('Erro na função link-user:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
