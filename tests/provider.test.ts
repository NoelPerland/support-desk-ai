import { test } from "node:test";
import assert from "node:assert/strict";
import { generate, AppError } from "../lib/server";
test("provider failures and malformed JSON never become fabricated results", async () => {
  const previous = global.fetch,
    key = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "test-key";
  try {
    global.fetch = async () =>
      new Response('{"error":{"message":"quota"}}', { status: 429 });
    await assert.rejects(
      generate("support-desk", "Synthetic source"),
      (e: unknown) => e instanceof AppError && e.status === 429,
    );
    global.fetch = async () =>
      Response.json({
        choices: [{ message: { content: '{"title":"incomplete"}' } }],
      });
    await assert.rejects(
      generate("meeting-notes", "Synthetic source"),
      /incomplete draft/,
    );
    delete process.env.GROQ_API_KEY;
    await assert.rejects(
      generate("support-desk", "Synthetic source"),
      /temporarily unavailable/,
    );
  } finally {
    global.fetch = previous;
    if (key) process.env.GROQ_API_KEY = key;
    else delete process.env.GROQ_API_KEY;
  }
});
