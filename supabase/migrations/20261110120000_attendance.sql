-- Add attendance table to track absences and tardies per enrollment/term

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  absences int not null default 0,
  tardies int not null default 0,
  unique (enrollment_id, term_id)
);

alter table public.attendance enable row level security;

-- Policies will be set by 20261109120000_fix_rls_policies.sql
-- but add placeholders in case that migration hasn't run yet

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'attendance' and policyname = 'attendance_read'
  ) then
    create policy "attendance_read" on public.attendance
      for select to authenticated
      using (exists (
        select 1 from public.enrollments e
        join public.courses c on c.id = e.course_id
        where e.id = enrollment_id and (
          public.is_system_admin()
          or public.has_site_role(c.site_id, array['site_admin','teacher']::public.site_role[])
        )
      ));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'attendance' and policyname = 'attendance_write'
  ) then
    create policy "attendance_write" on public.attendance
      for all to authenticated
      using (exists (
        select 1 from public.enrollments e
        where e.id = enrollment_id and public.can_grade_course(e.course_id)
      ))
      with check (exists (
        select 1 from public.enrollments e
        where e.id = enrollment_id and public.can_grade_course(e.course_id)
      ));
  end if;
end $$;
