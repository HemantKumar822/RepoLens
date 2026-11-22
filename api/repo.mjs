import { inspectRepository } from '../server.mjs';

export const maxDuration = 30;

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const url = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
    const data = await inspectRepository(url.searchParams.get('url') || '');
    sendJson(response, 200, data);
  } catch (error) {
    sendJson(response, 400, { error: error.message || 'Something went wrong. Try again.' });
  }
}
