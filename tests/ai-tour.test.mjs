import assert from 'node:assert/strict';
import test from 'node:test';
import { generateTour } from '../server.mjs';

test('requests a concise JSON tour without spending its answer budget on reasoning', async () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalFetch = globalThis.fetch;
  let requestBody;
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ headline: 'Start here', answer: 'This folder contains the main app.', points: [], nextStep: '', evidence: [] }) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const tour = await generateTour({
      repository: {
        url: 'https://github.com/example/repo',
        fullName: 'example/repo',
        defaultBranch: 'main',
      },
      files: [],
      structure: { directories: [] },
      question: 'Where should I start?',
    });

    assert.equal(tour.answer, 'This folder contains the main app.');
    assert.equal(requestBody.model, 'openai/gpt-oss-20b');
    assert.equal(requestBody.include_reasoning, false);
    assert.equal(requestBody.reasoning_effort, 'low');
    assert.equal(requestBody.max_completion_tokens, 900);
    assert.deepEqual(requestBody.response_format, { type: 'json_object' });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});
