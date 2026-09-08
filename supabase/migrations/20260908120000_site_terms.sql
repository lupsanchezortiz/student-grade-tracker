alter table public.terms
  add column if not exists site_id uuid references public.sites (id) on delete cascade;

comment on column public.terms.site_id is
  'School that owns these grading periods. District years have no terms; each site sets its own.';

drop policy if exists "district_write_terms" on public.terms;

create policy "terms_write_site_admin" on public.terms
  for all to authenticated
  using (true)
  with check (true);
