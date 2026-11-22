import { inspectRepository } from '../server.mjs';

export const maxDuration = 30;

export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const data = await inspectRepository(url.searchParams.get('url') || '');
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message || 'Something went wrong. Try again.' }, { status: 400 });
  }
}
