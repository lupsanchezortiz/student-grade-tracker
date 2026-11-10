# Pull Request Details

**Branch:** `cursor/fix-rls-policies-fd7b`  
**Base:** `main`

## Title
Fix overly permissive RLS policies for FERPA compliance

## Description

## Problem

The application's Supabase Row Level Security (RLS) policies had three critical gaps that allowed unauthorized access to student data across site boundaries. These must be fixed before storing real student data in Supabase.

### 1. Terms Table - Open Write Access
**Severity: High** - Any authenticated user could create, modify, or delete grading terms for any school.

The `terms_write_site_admin` policy (added in `20260908120000_site_terms.sql`) used:
```sql
using (true) with check (true)
```

This allowed any authenticated user to manipulate all terms, including:
- District-wide terms that should only be managed by system admins
- Site-specific terms that should only be managed by that site's admins

### 2. Attendance Table - Completely Open
**Severity: Critical** - Any authenticated user could read and write all attendance records across all schools.

Both policies (added in `20260906180000_html_documents.sql`) used:
```sql
attendance_read: using (true)
attendance_write: using (true) with check (true)
```

This violated FERPA requirements by allowing cross-site access to student attendance data.

### 3. Grades Table - Overly Broad Read Access
**Severity: High** - Teachers could view grades for all courses at their site, not just courses they teach.

The `grades_read` policy allowed any teacher at a site to read all grades from that site:
```sql
has_site_role(c.site_id, array['site_admin','teacher'])
```

A teacher assigned to 5th grade could view 3rd grade report cards, specialist grades, etc.

## Solution

This PR adds a new migration (`20261109120000_fix_rls_policies.sql`) that tightens these policies using the existing RLS helper functions.

### 1. Terms - Proper Site Isolation

**District terms** (site_id IS NULL): Only system admins can write
**Site terms** (site_id IS NOT NULL): Only system admins OR that site's site_admins can write

```sql
using (
  public.is_system_admin()
  or (site_id is not null and public.has_site_role(site_id, array['site_admin']))
)
```

Read access remains open to all authenticated users (terms are catalog data).

### 2. Attendance - Enrollment-Based Access

**Read**: System admin, site_admin of the course's site, or any teacher at that site
**Write**: System admin, site_admin of the course's site, or teachers who can grade that course

```sql
-- Read matches course site membership
using (exists (
  select 1 from enrollments e
  join courses c on c.id = e.course_id
  where e.id = enrollment_id 
    and (is_system_admin() or has_site_role(c.site_id, array['site_admin','teacher']))
))

-- Write uses can_grade_course (respects can_grade flag)
using (exists (
  select 1 from enrollments e
  where e.id = enrollment_id and can_grade_course(e.course_id)
))
```

### 3. Grades - Course Assignment Required

Teachers can only view grades for courses they're explicitly assigned to via `course_teachers`:

```sql
using (exists (
  select 1 from enrollments e
  join courses c on c.id = e.course_id
  where e.id = enrollment_id and (
    is_system_admin()
    or has_site_role(c.site_id, array['site_admin'])
    or exists (
      select 1 from course_teachers t
      where t.course_id = c.id and t.profile_id = auth.uid()
    )
  )
))
```

## How to Apply

### Option A: Supabase CLI (recommended)
```bash
# Local development
npx supabase db reset

# Production
npx supabase db push
```

### Option B: Supabase Dashboard
1. Navigate to SQL Editor in your Supabase project
2. Copy contents of `supabase/migrations/20261109120000_fix_rls_policies.sql`
3. Paste and run in the SQL Editor

## Verification

The migration includes comprehensive verification steps in `MIGRATION_VERIFICATION.md`:

### Quick Check - Verify Policies Exist
```sql
select tablename, policyname from pg_policies
where tablename in ('terms', 'attendance', 'grades')
order by tablename, policyname;
```

**Expected output:**
- `attendance`: 2 policies (attendance_read, attendance_write)
- `grades`: 2 policies (grades_read, grades_write)  
- `terms`: 2 policies (catalog_read, terms_write_site_admin)

### Functional Tests

The verification guide includes SQL test cases for:

1. **Terms isolation** - Site B admin cannot modify Site A terms
2. **Attendance isolation** - Site B teacher cannot view Site A attendance
3. **Grades isolation** - Teacher B cannot view Course 1 grades (not assigned)

See `MIGRATION_VERIFICATION.md` for complete test scripts.

## Migration Properties

- ✅ **Idempotent**: Uses `DROP POLICY IF EXISTS` before creating policies
- ✅ **No data changes**: Only modifies security policies
- ⚠️ **Potentially breaking**: May block operations that relied on overly permissive policies
- ✅ **Performance neutral**: Uses same indexed helper functions as existing policies

## Rollback Plan

If critical issues arise, the old (insecure) policies can be restored. See the "Rollback Plan" section in `MIGRATION_VERIFICATION.md`.

**Note**: The old policies violate FERPA isolation requirements. Any rollback should be temporary while investigating issues, not a permanent solution.

## Testing Checklist

After applying to your environment:

- [ ] Migration applies without SQL errors
- [ ] Verification queries return expected policy counts
- [ ] System admin can create district-wide terms
- [ ] Site admin can create terms for their site only (blocked from other sites)
- [ ] Teachers can view grades only for their assigned courses
- [ ] Teachers can edit attendance only for courses they can grade
- [ ] Site A staff cannot access Site B data (and vice versa)
- [ ] Gradebook UI still loads correctly
- [ ] Report card generation still works
- [ ] CSV import functions still work

## Files Changed

- `supabase/migrations/20261109120000_fix_rls_policies.sql` - The migration
- `MIGRATION_VERIFICATION.md` - Comprehensive testing and verification guide

## Related

Addresses Task 1 from the gap analysis (uploaded document). This prepares the database for storing real student data by ensuring proper FERPA-style site isolation.

Next steps (separate PRs):
- Task 2: Prevent JSON store usage when Supabase is configured
- Task 3: Wire Supabase persistence for core entities

---

## How to Create the PR

You can create the PR using the GitHub CLI or the web interface:

### Using GitHub CLI:
```bash
gh pr create --base main --head cursor/fix-rls-policies-fd7b \
  --title "Fix overly permissive RLS policies for FERPA compliance" \
  --body-file PR_DETAILS.md
```

### Using GitHub Web:
Visit: https://github.com/lupsanchezortiz/student-grade-tracker/pull/new/cursor/fix-rls-policies-fd7b
