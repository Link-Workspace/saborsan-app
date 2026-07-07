const { app } = require('@azure/functions');
const sql = require('mssql');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// Inicializar Firebase Admin (singleton)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('send-notification', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, deviceId, title, body, data } = await request.json();
      if (!title) return { status: 400, jsonBody: { error: 'title é obrigatório' } };

      await sql.connect(sqlConfig);

      // Buscar tokens do usuário ou dispositivo
      let tokensResult;
      if (userId) {
        tokensResult = await sql.query`SELECT token FROM PushTokens WHERE userId = ${userId}`;
      } else if (deviceId) {
        tokensResult = await sql.query`SELECT token FROM PushTokens WHERE deviceId = ${deviceId}`;
      } else {
        return { status: 400, jsonBody: { error: 'userId ou deviceId são obrigatórios' } };
      }

      const tokens = tokensResult.recordset.map(r => r.token).filter(Boolean);
      if (tokens.length === 0) return { jsonBody: { success: true, sent: 0 } };

      // Enviar via FCM
      const messaging = getMessaging();
      let sent = 0;
      for (const token of tokens) {
        try {
          await messaging.send({
            token,
            notification: { title, body: body || '' },
            data: data || {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          });
          sent++;
        } catch (err) {
          // Token inválido — remover do banco
          if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
            await sql.query`DELETE FROM PushTokens WHERE token = ${token}`;
          }
        }
      }

      return { jsonBody: { success: true, sent } };
    } catch (error) {
      context.error('Erro em send-notification:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
