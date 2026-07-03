// Cache da configuração do agente ElevenLabs (voz + prompt)
let cachedAgentConfig = null;

async function getAgentConfig() {
  if (cachedAgentConfig) return cachedAgentConfig;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`,
    { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
  );
  const data = await res.json();
  cachedAgentConfig = {
    voiceId: data.conversation_config?.tts?.voice_id || null,
    prompt: data.conversation_config?.agent?.prompt?.prompt || '',
  };
  return cachedAgentConfig;
}

module.exports = { getAgentConfig };
