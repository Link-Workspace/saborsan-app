const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('settings', {
  methods: ['GET', 'PATCH'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await sql.connect(sqlConfig);

      if (request.method === 'GET') {
        const userId = request.query.get('userId');
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        // Buscar ou criar configurações padrão
        let result = await sql.query`SELECT * FROM UserSettings WHERE userId = ${userId}`;
        if (result.recordset.length === 0) {
          await sql.query`INSERT INTO UserSettings (userId) VALUES (${userId})`;
          result = await sql.query`SELECT * FROM UserSettings WHERE userId = ${userId}`;
        }
        return { jsonBody: { settings: result.recordset[0] } };
      }

      if (request.method === 'PATCH') {
        const { userId, language, notificationSound, deliveryNotifications } = await request.json();
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        await sql.query`
          MERGE UserSettings AS target
          USING (SELECT ${userId} AS userId) AS source ON target.userId = source.userId
          WHEN MATCHED THEN UPDATE SET
            language = COALESCE(${language ?? null}, language),
            notificationSound = COALESCE(${notificationSound ?? null}, notificationSound),
            deliveryNotifications = COALESCE(${deliveryNotifications ?? null}, deliveryNotifications),
            updatedAt = GETUTCDATE()
          WHEN NOT MATCHED THEN INSERT (userId, language, notificationSound, deliveryNotifications)
            VALUES (source.userId, ${language || 'pt'}, ${notificationSound ?? 1}, ${deliveryNotifications ?? 1});
        `;
        const result = await sql.query`SELECT * FROM UserSettings WHERE userId = ${userId}`;
        return { jsonBody: { settings: result.recordset[0] } };
      }
    } catch (error) {
      context.error('Erro na função settings:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
