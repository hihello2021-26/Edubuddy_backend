require('dotenv').config();
const { generateText } = require('../services/aiService');

async function run() {
  try {
    const system = 'You are a helpful assistant. Reply ONLY with JSON.';
    const prompt = 'Return this exact JSON: {"ok": true, "note":"gemini test"}';
    const raw = await generateText(system, prompt, { provider: 'gemini', json: true, maxOutputTokens: 200 });
    console.log('Raw response:', raw);
  } catch (err) {
    console.error('Gemini test failed:', err.message);
  }
}

run();
