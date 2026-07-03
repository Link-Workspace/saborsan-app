// Cache da configuração do agente ElevenLabs (voz + prompt)
let cachedAgentConfig = null;

async function getAgentConfig() {
  if (cachedAgentConfig) return cachedAgentConfig;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`,
      { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
    );
    const data = await res.json();

    // Tentar diferentes caminhos possíveis para o voice_id
    const voiceId =
      data.conversation_config?.tts?.voice_id ||
      data.agent?.tts?.voice_id ||
      data.tts?.voice_id ||
      process.env.ELEVENLABS_VOICE_ID ||
      null;

    const prompt =
      data.conversation_config?.agent?.prompt?.prompt ||
      data.agent?.prompt?.prompt ||
      data.prompt?.prompt ||
      '';

    cachedAgentConfig = { voiceId, prompt };
  } catch {
    // Fallback para variáveis de ambiente
    cachedAgentConfig = {
      voiceId: process.env.ELEVENLABS_VOICE_ID || null,
      prompt: '',
    };
  }
  return cachedAgentConfig;
}

module.exports = { getAgentConfig };
