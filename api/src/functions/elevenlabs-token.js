const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('elevenlabs-token', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const deviceId = request.query.get('deviceId');

      const [tokenRes, historyResult] = await Promise.all([
        fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
          { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
        ),
        deviceId
          ? sql.connect(sqlConfig).then(() =>
              sql.query`SELECT TOP 20 role, content FROM Messages WHERE deviceId = ${deviceId} ORDER BY createdAt DESC`
            ).then(r => r.recordset.reverse()).catch(() => [])
          : Promise.resolve([]),
      ]);

      const data = await tokenRes.json();
      if (!data.signed_url) {
        context.error('ElevenLabs não retornou signed_url:', data);
        return { status: 500, jsonBody: { error: 'Erro ao obter URL de chamada' } };
      }

      const historyContext = historyResult.length
        ? '\n\nContexto da conversa anterior por texto:\n' +
          historyResult.map(m => `${m.role === 'user' ? 'Cliente' : 'Vendedor'}: ${m.content}`).join('\n')
        : '';

      return { jsonBody: { signedUrl: data.signed_url, historyContext } };
    } catch (error) {
      context.error('Erro na função elevenlabs-token:', error);
      return { status: 500, jsonBody: { error: 'Erro ao iniciar chamada' } };
    } finally {
      await sql.close().catch(() => {});
    }
  },
});
