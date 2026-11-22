import { generateAnalysis } from '../server.mjs';

export const maxDuration = 60;

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
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const body = await readJson(request);
    if (!body.repository || !Array.isArray(body.files)) {
      sendJson(response, 400, { error: 'Analyze a repository first.' });
      return;
    }
    const analysis = await generateAnalysis(body);
    sendJson(response, 200, { analysis, aiEnabled: Boolean(analysis) });
  } catch (error) {
    sendJson(response, 400, { error: error.message || 'Something went wrong. Try again.' });
  }
}
