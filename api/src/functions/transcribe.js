const { app } = require('@azure/functions');
const { OpenAI } = require('openai');
const { uploadAudio } = require('../storage');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.http('transcribe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const formData = await request.formData();
      const audioFile = formData.get('audio');

      if (!audioFile) {
        return { status: 400, jsonBody: { error: 'audio é obrigatório' } };
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = audioFile.type || 'audio/webm';
      const file = new File([buffer], 'audio.webm', { type: mimeType });

      const [transcription, audioUrl] = await Promise.all([
        openai.audio.transcriptions.create({ file, model: 'whisper-1', language: 'pt' }),
        uploadAudio(buffer, mimeType, 'audio-clientes').catch(() => null),
      ]);

      return { jsonBody: { text: transcription.text, audioUrl } };
    } catch (error) {
      context.error('Erro na função transcribe:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    }
  },
});
