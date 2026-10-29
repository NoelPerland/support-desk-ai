create table public.app_ai_account_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('support-desk','meeting-notes')),
 source text not null check (char_length(source) between 30 and 6000),
 result jsonb not null check (octet_length(result::text) <= 24000),
 state text not null default 'Open' check (state in ('Open','Reviewed','Done')),
 created_at timestamptz not null default now()
);
create index app_ai_account_records_owner_kind on public.app_ai_account_records(user_id,kind,created_at desc);
alter table public.app_ai_account_records enable row level security;
revoke all on public.app_ai_account_records from anon, public;
grant select,insert,update,delete on public.app_ai_account_records to authenticated;
create policy app_ai_account_owner on public.app_ai_account_records for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
