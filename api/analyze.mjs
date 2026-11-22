import { generateAnalysis } from '../server.mjs';

export const maxDuration = 60;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }

  try {
    const body = await request.json();
    if (!body.repository || !Array.isArray(body.files)) {
      return Response.json({ error: 'Analyze a repository first.' }, { status: 400 });
    }
    const analysis = await generateAnalysis(body);
    return Response.json({ analysis, aiEnabled: Boolean(analysis) });
  } catch (error) {
    return Response.json({ error: error.message || 'Something went wrong. Try again.' }, { status: 400 });
  }
}
