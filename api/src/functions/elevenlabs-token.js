const { app } = require('@azure/functions');

app.http('elevenlabs-token', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
        { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
      );
      const data = await res.json();
      if (!data.signed_url) {
        context.error('ElevenLabs não retornou signed_url:', data);
        return { status: 500, jsonBody: { error: 'Erro ao obter URL de chamada' } };
      }
      return { jsonBody: { signedUrl: data.signed_url } };
    } catch (error) {
      context.error('Erro na função elevenlabs-token:', error);
      return { status: 500, jsonBody: { error: 'Erro ao iniciar chamada' } };
    }
  },
});
