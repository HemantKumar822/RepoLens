import { generateTour } from '../server.mjs';

export const maxDuration = 45;

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request is too large.');
  }
  return JSON.parse(body || '{}');
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  try {
    const result = await generateTour(await readJson(request));
    if (!result) return sendJson(response, 503, { error: 'Add GROQ_API_KEY in the Vercel project settings to start an AI tour.' });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 400, { error: error.message || 'Could not create the tour.' });
  }
}
