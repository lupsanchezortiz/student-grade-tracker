alter table public.report_card_templates
  add column if not exists html_en text not null default '',
  add column if not exists html_es text not null default '';

alter table public.template_items
  add column if not exists print_code text;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  absences int not null default 0,
  tardies int not null default 0,
  unique (enrollment_id, term_id)
);

alter table public.attendance enable row level security;

create policy "attendance_read" on public.attendance
  for select to authenticated using (true);

create policy "attendance_write" on public.attendance
  for all to authenticated
  using (true)
  with check (true);
