import { SYSTEM_PROMPT } from '../gameLogic';

const MISTRAL_API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

export const sendMessage = async (userMessage: string): Promise<string> => {
  try {
    const apiKey = process.env.REACT_APP_MISTRAL_API_KEY;
    console.log('API Key available:', !!apiKey); // Will log true/false without exposing the key
    console.log('API Key length:', apiKey?.length);
    console.log('First 4 chars of API key:', apiKey?.substring(0, 4));
    
    if (!apiKey) {
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      throw new Error('Mistral API key not found. Please add it to your .env file.');
    }

    const requestBody = {
      model: "mistral-medium",  // or "mistral-small", "mistral-large" depending on your needs
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 8192
    };

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    });

    console.log('Full request config:', {
      url: MISTRAL_API_ENDPOINT,
      method: 'POST',
      headers: Object.fromEntries(headers.entries()),
      bodyLength: JSON.stringify(requestBody).length
    });

    const response = await fetch(MISTRAL_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Mistral API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to communicate with Mistral AI: ${error.message}`);
    }
    throw error;
  }
}; 