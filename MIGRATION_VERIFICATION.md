# RLS Policy Fix Migration Verification Guide

## Migration: `20261109120000_fix_rls_policies.sql`

This migration fixes three critical RLS policy issues that allowed unauthorized access to student data.

## Issues Fixed

### 1. **Terms Table** - Overly Permissive Write Policy
**Before:** Any authenticated user could insert/update/delete all terms (district-wide and site-specific)
```sql
-- Old policy used: using (true) with check (true)
```

**After:** 
- District terms (site_id IS NULL): Only system admins can write
- Site terms (site_id IS NOT NULL): System admins OR site_admins of that site can write
- Read access remains open to all authenticated users (catalog data)

### 2. **Attendance Table** - Completely Open Policies
**Before:** Any authenticated user could read/write all attendance records across all sites
```sql
-- Old policies used: using (true) with check (true)
```

**After:**
- Read: System admin, site_admin of the course's site, or any teacher at that site
- Write: System admin, site_admin of the course's site, or teachers who can grade that course (respects `can_grade` and course assignment)

### 3. **Grades Table** - Overly Broad Read Access
**Before:** Any teacher at a site could read ALL grades from that site, even for courses they don't teach

**After:** Grades visible only to:
- System admins (district-wide access)
- Site admins of the course's site
- Teachers explicitly assigned to that specific course (via `course_teachers`)

---

## How to Apply the Migration

### Option A: Using Supabase CLI (Recommended)

1. **Apply to local development:**
   ```bash
   npx supabase db reset
   ```

2. **Apply to production:**
   ```bash
   npx supabase db push
   ```

### Option B: Using Supabase Dashboard

1. Navigate to your project in the Supabase Dashboard
2. Go to **SQL Editor**
3. Open the migration file: `supabase/migrations/20261109120000_fix_rls_policies.sql`
4. Copy the contents and paste into the SQL Editor
5. Click **Run** to execute

---

## Verification Queries

Run these queries after applying the migration to verify the policies are working correctly.

### 1. Verify Terms Policies Exist

```sql
-- Check that the new terms write policy exists
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'terms' and policyname = 'terms_write_site_admin';
```

**Expected:** One row showing the policy with proper `qual` and `with_check` expressions that reference `is_system_admin()` and `has_site_role()`.

### 2. Verify Attendance Policies Exist

```sql
-- Check attendance read policy
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename = 'attendance' and policyname = 'attendance_read';

-- Check attendance write policy
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename = 'attendance' and policyname = 'attendance_write';
```

**Expected:** Two rows showing both policies exist with proper role/site checks.

### 3. Verify Grades Read Policy Updated

```sql
-- Check grades read policy
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where tablename = 'grades' and policyname = 'grades_read';
```

**Expected:** One row showing the tightened policy that checks course_teachers assignment.

### 4. Count All RLS Policies

```sql
-- Ensure no policies were accidentally dropped
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
  and tablename in ('terms', 'attendance', 'grades')
group by tablename
order by tablename;
```

**Expected:**
- `attendance`: 2 policies (read + write)
- `grades`: 2 policies (read + write)
- `terms`: 2 policies (catalog_read from init.sql + terms_write_site_admin)

---

## Functional Testing

### Test 1: Terms Isolation

**Setup:**
```sql
-- As system admin, create test data
insert into sites (id, name, code) values 
  ('11111111-1111-1111-1111-111111111111', 'Site A', 'SITE_A'),
  ('22222222-2222-2222-2222-222222222222', 'Site B', 'SITE_B');

insert into academic_years (id, name, start_date, end_date, term_structure) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-27', '2026-08-01', '2027-06-30', 'trimester');

-- Create a site-specific term for Site A
insert into terms (id, academic_year_id, site_id, sort_order, name_en, name_es, start_date, end_date) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   '11111111-1111-1111-1111-111111111111', 1, 'Fall', 'Otoño', '2026-08-01', '2026-11-30');
```

**Test as Site B admin:**
```sql
-- This should FAIL (site B admin trying to update site A term)
set local role authenticated;
set local request.jwt.claims to '{"sub": "user-site-b-admin-id"}';

update terms 
set name_en = 'Modified' 
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
-- Expected: 0 rows updated (policy blocks this)
```

### Test 2: Attendance Isolation

**Setup:**
```sql
-- As system admin, create necessary data
-- (requires sites, students, courses, enrollments from test 1 setup)

insert into attendance (enrollment_id, term_id, absences, tardies) values
  ('{enrollment-id-site-a}', '{term-id-site-a}', 2, 1);
```

**Test as Site B teacher:**
```sql
-- This should FAIL (site B teacher trying to read site A attendance)
set local role authenticated;
set local request.jwt.claims to '{"sub": "user-site-b-teacher-id"}';

select * from attendance where enrollment_id = '{enrollment-id-site-a}';
-- Expected: 0 rows (policy blocks cross-site access)
```

### Test 3: Grades Read Isolation

**Setup:**
```sql
-- As system admin, create course with teacher assignments
-- Teacher A is assigned to Course 1
-- Teacher B is assigned to Course 2
-- Both courses at Site A

insert into grades (enrollment_id, term_id, template_item_id, comment) values
  ('{enrollment-course-1}', '{term-id}', '{item-id}', 'Good work');
```

**Test as Teacher B (not assigned to Course 1):**
```sql
-- This should FAIL (teacher B trying to read Course 1 grades)
set local role authenticated;
set local request.jwt.claims to '{"sub": "teacher-b-id"}';

select * from grades where enrollment_id = '{enrollment-course-1}';
-- Expected: 0 rows (policy blocks access to other courses' grades)
```

**Test as Teacher A (assigned to Course 1):**
```sql
-- This should SUCCEED
set local role authenticated;
set local request.jwt.claims to '{"sub": "teacher-a-id"}';

select * from grades where enrollment_id = '{enrollment-course-1}';
-- Expected: 1 row (teacher can see their own course grades)
```

---

## Rollback Plan

If issues are discovered after applying this migration, you can rollback by re-applying the old policies:

```sql
-- ROLLBACK: Restore old (insecure) policies - USE ONLY IN EMERGENCY

-- Terms (restore open policy)
drop policy if exists "terms_write_site_admin" on public.terms;
create policy "terms_write_site_admin" on public.terms
  for all to authenticated using (true) with check (true);

-- Attendance (restore open policies)  
drop policy if exists "attendance_read" on public.attendance;
drop policy if exists "attendance_write" on public.attendance;
create policy "attendance_read" on public.attendance
  for select to authenticated using (true);
create policy "attendance_write" on public.attendance
  for all to authenticated using (true) with check (true);

-- Grades (restore broad read)
drop policy if exists "grades_read" on public.grades;
create policy "grades_read" on public.grades
  for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = enrollment_id and (
      public.is_system_admin()
      or public.has_site_role(c.site_id, array['site_admin','teacher']::public.site_role[])
    )
  ));
```

**Note:** The rollback policies are INSECURE and should only be used temporarily if the new policies cause production issues. Investigate and fix forward rather than staying on insecure policies.

---

## Post-Migration Checklist

- [ ] Migration applied successfully (no SQL errors)
- [ ] All verification queries return expected results
- [ ] System admin can still create district-wide terms
- [ ] Site admins can create terms for their own sites only
- [ ] Teachers can only view grades for courses they're assigned to
- [ ] Teachers can only edit attendance for courses they can grade
- [ ] Site isolation is enforced (Site A staff cannot access Site B data)
- [ ] Application functionality still works (gradebook, report cards, imports)

---

## Additional Notes

### Migration Properties

- **Idempotent:** Yes - Uses `DROP POLICY IF EXISTS` before creating policies
- **Breaking Changes:** Potential - If application code relied on overly permissive policies
- **Data Migration:** No - Only changes policies, no data is modified
- **Backward Compatible:** No - Tightens security, may block previously allowed operations

### Performance Considerations

The new policies use the same RLS helper functions as existing policies:
- `is_system_admin()` - Simple profile lookup
- `has_site_role()` - Indexed site_memberships join
- `can_grade_course()` - Indexed course_teachers join

Performance impact should be minimal, as these functions are already used throughout the schema.
