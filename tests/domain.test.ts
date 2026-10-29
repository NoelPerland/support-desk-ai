import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inputSchema,
  validateResult,
  exportMarkdown,
  type RecordItem,
} from "../lib/domain";
const ticket = {
  title: "Duplicate payment",
  summary: "The customer reports two charges.",
  priority: "High",
  category: "Billing",
  reasoning: "Affects month-end accounts.",
  reply: "Thanks for letting us know. We can investigate the charges.",
  nextSteps: ["Check payment records"],
};
test("input is bounded and rejects unknown apps", () => {
  assert.equal(
    inputSchema.safeParse({ kind: "support-desk", source: "short" }).success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({ kind: "support-desk", source: "x".repeat(6001) })
      .success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({ kind: "unknown", source: "x".repeat(50) }).success,
    false,
  );
});
test("AI output must match the selected domain", () => {
  assert.equal(validateResult("support-desk", ticket).title, ticket.title);
  assert.throws(() =>
    validateResult("support-desk", { ...ticket, priority: "Critical" }),
  );
  assert.throws(() => validateResult("meeting-notes", ticket));
  assert.throws(() => validateResult("support-desk", { ...ticket, reply: "" }));
  assert.deepEqual(
    (
      validateResult("support-desk", {
        ...ticket,
        nextSteps: ["", "  ", "Check records"],
      }) as typeof ticket
    ).nextSteps,
    ["Check records"],
  );
});
test("exports preserve edits and checklist completion", () => {
  const r: RecordItem = {
    id: "1",
    kind: "meeting-notes",
    source: "notes",
    state: "Reviewed",
    created_at: "2026-10-29",
    result: {
      title: "Launch",
      summary: "The team reviewed launch.",
      decisions: ["Launch landing page first"],
      actions: [
        { task: "Test the form", owner: "Leo", due: "Friday", done: true },
      ],
      questions: ["Analytics?"],
    },
  };
  const markdown = exportMarkdown(r);
  assert.match(markdown, /- \[x\] Test the form — Leo · Friday/);
  assert.match(markdown, /Analytics\?/);
});
