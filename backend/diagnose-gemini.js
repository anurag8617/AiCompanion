require('dotenv').config();

const key = process.env.GEMINI_API_KEY;

console.log('--- Environment Diagnostic ---');
console.log('GEMINI_API_KEY exists:', !!key);

if (key) {
  console.log('Key length:', key.length);
  console.log('Key prefix:', key.substring(0, 7));
  
  if (key.startsWith('AQ.')) {
    console.log('❌ ERROR: This looks like a VestAuth token, NOT a Google API Key.');
    console.log('Google API keys must start with "AIzaSy".');
  } else if (key.startsWith('AIzaSy')) {
    console.log('✅ Key prefix looks correct (AIzaSy).');
  } else {
    console.log('⚠️ Warning: Key prefix is unusual for a Gemini API key.');
  }
}

async function testGemini() {
  if (!key) return;
  
  console.log('\n--- Testing Gemini Connection ---');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Your API key is valid.');
      console.log('Available models:', data.models.slice(0, 3).map(m => m.name));
    } else {
      console.log('❌ API Error:', response.status);
      console.log('Message:', data.error ? data.error.message : JSON.stringify(data));
      
      if (response.status === 401) {
        console.log('\nSUGGESTION:');
        console.log('1. Go to https://aistudio.google.com/');
        console.log('2. Click "Get API key"');
        console.log('3. Copy the key (it starts with AIzaSy)');
        console.log('4. Paste it into your backend/.env file.');
      }
    }
  } catch (err) {
    console.error('Connection Error:', err.message);
  }
}

testGemini();
