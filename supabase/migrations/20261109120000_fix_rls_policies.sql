-- Fix overly permissive RLS policies on terms, attendance, and grades
-- This migration tightens policies to enforce proper site/role isolation

-- ============================================================================
-- 1. Fix terms table write policy
-- ============================================================================
-- Terms can be district-wide (site_id IS NULL) or site-specific (site_id IS NOT NULL)
-- District terms: writable only by system admins
-- Site terms: writable by system admins OR site_admins of that site
-- Read policy (catalog_read) remains unchanged - all authenticated users can read terms

drop policy if exists "terms_write_site_admin" on public.terms;

create policy "terms_write_site_admin" on public.terms
  for all to authenticated
  using (
    public.is_system_admin()
    or (
      site_id is not null
      and public.has_site_role(site_id, array['site_admin']::public.site_role[])
    )
  )
  with check (
    public.is_system_admin()
    or (
      site_id is not null
      and public.has_site_role(site_id, array['site_admin']::public.site_role[])
    )
  );

-- ============================================================================
-- 2. Fix attendance table policies
-- ============================================================================
-- Attendance should be accessible only via enrollment → course → site membership
-- Read: system admin, site_admin of the course's site, or any teacher at that site
-- Write: system admin, site_admin of the course's site, or teachers who can grade that course

drop policy if exists "attendance_read" on public.attendance;
drop policy if exists "attendance_write" on public.attendance;

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

-- ============================================================================
-- 3. Tighten grades read policy
-- ============================================================================
-- Currently any teacher at the site can read all grades from that site
-- Tighten to: system admin, site_admin of the course's site, or teachers assigned to that course

drop policy if exists "grades_read" on public.grades;

create policy "grades_read" on public.grades
  for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = enrollment_id and (
      public.is_system_admin()
      or public.has_site_role(c.site_id, array['site_admin']::public.site_role[])
      or exists (
        select 1 from public.course_teachers t
        where t.course_id = c.id
          and t.profile_id = auth.uid()
      )
    )
  ));

comment on policy "grades_read" on public.grades is
  'Grades visible to system admin, site admin of the course site, or teachers assigned to that course';
