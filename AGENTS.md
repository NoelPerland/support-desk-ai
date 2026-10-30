# AI handoff — Reply Desk

Read README.md and `.env.example`. This is a standalone product, not the portfolio homepage.

- Use Node24, `npm ci`, `npm test`, `npm run build`. Start with `lib/product.ts`, `lib/domain.ts`, `lib/server.ts`, `lib/auth.ts`, `app/api/records/route.ts` and `app/workspace/workspace.tsx`.
- Preserve the editorial dispatch-desk design: warm white, graphite, restrained vermilion; avoid generic gradient dashboards.
- Real Groq generation must remain server-side, bounded and Zod-validated. Never fabricate a successful result on provider failure.
- Supabase is shared with the portfolio, Minute to Action and an unrelated food tracker. Never reset tables, weaken RLS or touch food_entries.
- Guest cookies, fixed product kind, same-origin mutations and account ownership are security boundaries. Test separate-browser read/edit isolation after changing them.
- Guest data and account data remain separate. Registration defaults disabled until production confirmation-email delivery is verified. Existing-account sign-in has not yet been browser-tested with credentials.
- Shared quotas are8/workspace,10/IP,100global attempts per rolling day. Failed provider calls count. Export important guest work within30days.
- Check generation, edit/status/reload, context, search/filter, copy/export, failure input retention, keyboard and360/390px phones. Real-device testing remains outstanding.
- Source main auto-deploys the existing Vercel support-desk-ai project in noel-perlands-projects. Production secrets live there; no service-role key is needed. The current standalone Groq key expires28January2027.
- Do not send customer messages, issue refunds, add payments or claim integrations that do not exist.
