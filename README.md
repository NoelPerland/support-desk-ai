# Reply Desk

A standalone full-stack AI workspace by Noel Perland. Built with Next.js App Router, React, TypeScript, Zod, Groq and Supabase. UI and application code are original; no full application template or copied UI kit.

## Run

Use Node 24 and npm. Copy `.env.example` to `.env.local` and supply server-side credentials. Run `npm ci`, `npm run dev`. Open `/` for the product page and `/workspace` for the working application.

`npm test` checks validation, output failure handling, exports, date handling and action state compatibility. `npm run build` includes production compilation and TypeScript checking.

## Product

Paste a customer request, add reusable approved company context, and get an editable summary, priority with reasoning, category, reply and next steps. Search and filter your inbox, track Open/Reviewed/Done, save changes, copy replies and export Markdown. Nothing is sent automatically.

## Storage and boundaries

Guest sessions use a random 256-bit HttpOnly capability cookie. Only its SHA-256 hash reaches Supabase. The existing `portfolio_ai_records` table restricts rows by capability and expires guest records after 30 days. Each product has a separate cookie name and fixed server-side product kind.

Optional account sign-in uses Supabase email/password authentication, verified server-side with the Auth user endpoint. Tokens stay in HttpOnly, SameSite=Lax cookies. Refresh tokens renew expired sessions. Account records use the separate `app_ai_account_records` table, restricted by `auth.uid() = user_id` for every operation. Guest data is never silently merged into accounts. `supabase/account-records.sql` documents the additive schema already applied to the shared project. Never apply it twice.

New account registration defaults off (`ENABLE_SIGNUP=false`) until production confirmation email delivery is configured and tested. Existing verified accounts can sign in. No SMTP or auth-provider settings are modified by this repository. Account work and guest work remain separate. The interface loads the newest 50 records; export important work.

The existing `portfolio_ai_budget` RPC enforces a shared rolling daily budget: 8 attempts per guest capability, 10 per IP and 100 globally across the portfolio and both applications. Failed provider calls count. These are employer demos, not paid unlimited services. Shared public quotas may be exhausted. The anonymous budget RPC is deliberately public; its database advisor warning is documented in the portfolio source.

Groq calls run only on the server with a 25-second timeout. Structured output is validated with Zod; there are no fabricated AI fallback results. Credentials and service errors are never returned to the client. Mutation endpoints enforce same-origin JSON requests and bounded bodies. Provider failure keeps the user's input. AI drafts must be reviewed before use.

No payments, automatic outbound messages, calendar access or recording. Avoid sensitive customer or meeting information in this public demonstration. Company context and unsubmitted input are kept in local browser storage and can be cleared from browser site data.

## Deploy

Deploy this repository as a Vercel Next.js project with Node 24. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GROQ_API_KEY` for Production. Keep the Groq key sensitive, never `NEXT_PUBLIC_`. Optional `GROQ_MODEL` overrides the currently tested `openai/gpt-oss-20b` model. Rotate the key before its expiry. The public Supabase key still requires the existing guest policies and account RLS schema; no service-role key is needed.

## Design

An operational dispatch desk: graphite navigation, flat white ticket surfaces, restrained vermilion routing accents, IBM Plex Sans and mono metadata. The landing page shows a split request queue and reply review; the workspace uses a compact inbox/document layout, distinct from the spacious journal presentation of Minute to Action.

Fonts are served by Google Fonts under their respective open font licenses; system fonts remain available when offline. Respect reduced-motion preferences. Native controls and dialogs support keyboard use. The app is designed for desktop and portrait mobile.

## Portable browser regression

Run `npm run build`, then `npm run test:browser` using Node24. The test starts/stops its own local production server and uses installed Google Chrome. Set `CHROME_PATH` to another Chromium executable when Chrome is not installed in its usual location. `playwright-core` is a development dependency; no browser download or credentials are required.

Checks cover blocked browser storage, nonempty/empty draft leave warnings, failed generation preserving exact input and enabling retry. Portfolio also checks canceled discard. API responses are mocked; this does not verify live AI, database isolation, real account login, session renewal, email delivery, or physical devices. Registration remains disabled pending real confirmation-email verification.

The regression also checks rejection of foreign-origin mutations. Standalone checks cover guest auth status, disabled registration and guest logout with backend credentials cleared. Real account login, refresh, isolation and email delivery remain release checklist items requiring authorized test accounts.

Before enabling registration, verify an authorized existing test account can sign in, refresh an expired access token, and sign out; confirm a separate browser cannot read/edit its records and guest work never silently merges. Test confirmation-email delivery and follow the link before changing `ENABLE_SIGNUP`. These checks need real authorized accounts and are not claimed by the local regression.
