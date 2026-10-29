import { z } from "zod";

export const kindSchema = z.enum(["support-desk", "meeting-notes"]);
export type Kind = z.infer<typeof kindSchema>;
const short = z.string().trim().min(1).max(240);
const lines = (max: number) =>
  z
    .array(z.string().trim().max(240))
    .max(max + 10)
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(short).max(max));
export const ticketSchema = z.object({
  title: short,
  summary: z.string().min(1).max(700),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  category: z.enum(["Billing", "Technical", "Account", "General"]),
  reasoning: z.string().min(1).max(500),
  reply: z.string().min(1).max(2500),
  nextSteps: lines(8),
});
export const meetingSchema = z.object({
  title: short,
  summary: z.string().min(1).max(1000),
  decisions: lines(12),
  actions: z
    .array(
      z.object({ task: short, owner: short, due: short, done: z.boolean(), status: z.enum(["To do", "In progress", "Done"]).optional() }),
    )
    .max(16),
  questions: lines(12),
});
export type Ticket = z.infer<typeof ticketSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type Result = Ticket | Meeting;
export function validateResult(kind: Kind, result: unknown): Result {
  return (kind === "support-desk" ? ticketSchema : meetingSchema).parse(result);
}
export const inputSchema = z.object({
  kind: kindSchema,
  source: z.string().trim().min(30).max(6000),
  context: z.string().trim().max(2000).optional(),
});
export const updateSchema = z.object({
  kind: kindSchema,
  id: z.uuid(),
  result: z.unknown(),
  state: z.enum(["Open", "Reviewed", "Done"]),
});
export type RecordItem = {
  id: string;
  kind: Kind;
  source: string;
  result: Result;
  state: "Open" | "Reviewed" | "Done";
  created_at: string;
};
export const apps = {
  "support-desk": {
    name: "Reply Desk",
    mark: "RD",
    eyebrow: "SUPPORT, SORTED",
    headline: "A clearer inbox. A thoughtful reply.",
    description:
      "Turn a messy support request into a priority, next steps, and a reply worth sending. Review it, make it yours, and keep the ticket moving.",
    inputLabel: "Customer message",
    placeholder: "Paste a support request here…",
    button: "Triage ticket",
    item: "ticket",
    sample:
      "Hi, I manage the account for our 18-person studio. We were charged twice for our October subscription yesterday. Both payments appear as completed in our bank app. Our account email is studio@example.com. We need the duplicate charge investigated before our month-end accounts close on Friday. Can someone check and explain what happens next? Thanks, Alex.",
    schema:
      '{"title":"short ticket title","summary":"brief factual summary","priority":"Low|Medium|High|Urgent","category":"Billing|Technical|Account|General","reasoning":"why this priority","reply":"empathetic reply draft, no invented refunds or promises","nextSteps":["action"]}',
    instruction:
      "Triage this support request. Prioritise actual impact and urgency, not threats or demands. Do not claim actions were performed. Do not invent policies, refunds, timelines, or facts. Draft an empathetic response asking for needed details. Never ask for passwords or full card details.",
  },
  "meeting-notes": {
    name: "Minute to Action",
    mark: "MA",
    eyebrow: "LESS RECAP. MORE FOLLOW-THROUGH.",
    headline: "Good meetings deserve a next step.",
    description:
      "Find the decisions, owners, and loose ends hiding in your notes. Turn the conversation into a saved checklist your team can actually use.",
    inputLabel: "Meeting notes",
    placeholder: "Paste your meeting notes or transcript here…",
    button: "Create action plan",
    item: "meeting",
    sample:
      "Website launch check-in, 28 October. Maya and Leo attended. We agreed to launch the small business landing page first and leave the blog for a later release. Maya will finish the mobile navigation by Friday. Leo will check the contact form and add an automated test before launch. We still need someone to review the privacy copy; no owner was assigned. The team has not decided whether analytics should be enabled at launch. Next check-in is Monday.",
    schema:
      '{"title":"short meeting title","summary":"brief factual recap","decisions":["explicit decision"],"actions":[{"task":"action","owner":"named owner or Unassigned","due":"stated due date or Not specified","done":false}],"questions":["unresolved question"]}',
    instruction:
      "Extract only supported decisions and actions. Never invent people, decisions, deadlines or assignments. Use Unassigned and Not specified when absent. Keep relative dates as stated because the meeting date may be unknown. All actions start done:false. Include uncertainty as open questions.",
  },
} as const;

export function exportMarkdown(record: RecordItem): string {
  const r = record.result;
  const lines = [`# ${r.title}`, "", r.summary, ""];
  if ("reply" in r)
    lines.push(
      `Priority: ${r.priority} · ${r.category}`,
      "",
      "## Reply draft",
      r.reply,
      "",
      "## Next steps",
      ...r.nextSteps.map((s) => `- ${s}`),
    );
  else
    lines.push(
      "## Decisions",
      ...r.decisions.map((s) => `- ${s}`),
      "",
      "## Actions",
      ...r.actions.map(
        (a) => `- [${a.done ? "x" : " "}] ${a.task} — ${a.owner} · ${a.due}`,
      ),
      "",
      "## Open questions",
      ...r.questions.map((s) => `- ${s}`),
    );
  return [
    ...lines,
    "",
    "---",
    "AI-assisted draft. Reviewed and edited by the user as needed.",
  ].join("\n");
}

export function actionStatus(a: Meeting["actions"][number]) { return a.done ? "Done" : a.status || "To do"; }

export function csvCell(value: string) { return '"' + (/^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""') + '"'; }

export function exportCsv(records: RecordItem[]) {

 const rows = [["Meeting","Action","Owner","Due","Status"]];

 for (const r of records) if ("actions" in r.result) for (const a of r.result.actions) rows.push([r.result.title,a.task,a.owner,a.due,actionStatus(a)]);

 return rows.map(row => row.map(csvCell).join(",")).join("\r\n");

}

export function isOverdue(due: string, now = new Date()) {

 if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return false;

 const parsed = new Date(due + "T00:00:00Z");
 if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== due) return false;
 return due < now.toISOString().slice(0,10);

}

