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
      const { deviceId, conversationId } = body;

      if (!deviceId || !conversationId) {
        return { status: 400, jsonBody: { error: 'deviceId e conversationId são obrigatórios' } };
      }

      // Buscar transcrição completa da chamada na API do ElevenLabs
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
        { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
      );

      if (!res.ok) {
        context.warn('ElevenLabs retornou erro ao buscar transcrição:', res.status);
        return { status: 200, jsonBody: { success: false, reason: 'transcript_unavailable' } };
      }

      const data = await res.json();
      const transcript = data.transcript || [];

      if (transcript.length === 0) {
        return { jsonBody: { success: true, saved: 0 } };
      }

      await sql.connect(sqlConfig);

      for (const entry of transcript) {
        const role = entry.role === 'user' ? 'user' : 'assistant';
        const content = entry.message || entry.content || '';
        if (!content.trim()) continue;
        await sql.query`
          INSERT INTO Messages (deviceId, role, content, createdAt)
          VALUES (${deviceId}, ${role}, ${content}, GETUTCDATE())
        `;
      }

      return { jsonBody: { success: true, saved: transcript.length } };
    } catch (error) {
      context.error('Erro na função save-transcript:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
