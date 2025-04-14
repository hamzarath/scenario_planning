import { SYSTEM_PROMPT } from '../gameLogic';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const sendMessage = async (userMessage: string): Promise<string> => {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('API Key available:', !!apiKey);
    
    if (!apiKey) {
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      throw new Error('Gemini API key not found. Please add it to your .env file.');
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { text: userMessage }
        ]
      }]
    };

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    console.log('Full request config:', {
      url: GEMINI_API_ENDPOINT,
      method: 'POST',
      headers: Object.fromEntries(headers.entries()),
      bodyLength: JSON.stringify(requestBody).length
    });

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to communicate with Gemini AI: ${error.message}`);
    }
    throw error;
  }
}; 