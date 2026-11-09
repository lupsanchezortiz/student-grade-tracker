# RLS Policy Audit Summary

## Audit Scope

Comprehensive review of all Row Level Security policies in the Supabase migrations to ensure proper data isolation by site and role (district admin / site admin / teacher).

## Methodology

1. Read all SQL migration files in `supabase/migrations/`
2. Identified all tables with `enable row level security`
3. Analyzed each policy's `using` and `with check` clauses
4. Compared against the existing RLS helper functions: `is_system_admin()`, `has_site_role()`, `can_grade_course()`
5. Verified consistency with the app's role model

## Tables Audited

### District Catalog Tables (✅ Correct)
These tables store shared district-wide data and have appropriate RLS policies:

| Table | Read Policy | Write Policy | Status |
|-------|-------------|--------------|--------|
| `academic_years` | All authenticated users | System admin only | ✅ Correct |
| `grade_levels` | All authenticated users | System admin only | ✅ Correct |
| `grade_scales` | All authenticated users | System admin only | ✅ Correct |
| `grade_scale_marks` | All authenticated users | System admin only | ✅ Correct |
| `report_card_templates` | All authenticated users | System admin only | ✅ Correct |
| `template_grade_levels` | All authenticated users | System admin only | ✅ Correct |
| `template_sections` | All authenticated users | System admin only | ✅ Correct |
| `template_items` | All authenticated users | System admin only | ✅ Correct |

### Terms Table (❌ FIXED)

**Before:**
- Read: All authenticated users ✅
- Write: `using (true) with check (true)` ❌ - **Any authenticated user**

**Issue:** After adding `site_id` column (migration 20260908120000), the write policy was not updated to enforce site isolation. District terms (site_id IS NULL) and site terms (site_id IS NOT NULL) both had open write access.

**Fixed:** 
- District terms: System admin only
- Site terms: System admin OR site_admin of that site

### Site Tables (✅ Correct)

| Table | Read Policy | Write Policy | Status |
|-------|-------------|--------------|--------|
| `sites` | System admin OR member of site | System admin only | ✅ Correct |
| `site_memberships` | System admin OR self OR member of site | System admin OR site_admin of site | ✅ Correct |

### User Tables (✅ Correct)

| Table | Read Policy | Write Policy | Status |
|-------|-------------|--------------|--------|
| `profiles` | Self OR system admin OR same-site staff | Self (cannot escalate system admin) | ✅ Correct |

### Student/Staff Data Tables (✅ Correct except grades read)

| Table | Read Policy | Write Policy | Status |
|-------|-------------|--------------|--------|
| `students` | System admin OR site member | System admin OR site_admin of site | ✅ Correct |
| `courses` | System admin OR site member | System admin OR site_admin of site | ✅ Correct |
| `course_teachers` | System admin OR site member (via course) | System admin OR site_admin of site | ✅ Correct |
| `enrollments` | System admin OR site member (via course) | System admin OR site_admin of site | ✅ Correct |

### Grades Table (⚠️ TIGHTENED)

**Before:**
- Read: System admin OR **any teacher/admin at the course's site** ⚠️
- Write: System admin OR site_admin of site OR assigned teacher with `can_grade=true` ✅

**Issue:** Teachers could view grades for ALL courses at their site, not just their assigned courses. A 5th grade teacher could view 3rd grade report cards, specialist grades, etc.

**Fixed:**
- Read: System admin OR site_admin of site OR **assigned teacher for that specific course**
- Write: Unchanged (already correct)

### Attendance Table (❌ FIXED)

**Before:**
- Read: `using (true)` ❌ - **Any authenticated user**
- Write: `using (true) with check (true)` ❌ - **Any authenticated user**

**Issue:** Complete open access to attendance records across all schools and courses. Critical FERPA violation.

**Fixed:**
- Read: System admin OR site member (via enrollment→course→site)
- Write: System admin OR can_grade_course (same authorization as grades)

## Helper Functions Analyzed

### `is_system_admin()`
```sql
-- Returns true if current user is marked as system admin in profiles
select exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_system_admin
);
```
**Usage:** District-wide access control. Used correctly throughout.

### `has_site_role(target_site uuid, roles site_role[])`
```sql
-- Returns true if current user has one of the specified roles at the target site
select exists (
  select 1 from public.site_memberships m
  where m.profile_id = auth.uid()
    and m.site_id = target_site
    and m.role = any(roles)
);
```
**Usage:** Site-specific access control. Used correctly throughout. Now applied to terms and attendance.

### `can_grade_course(target_course uuid)`
```sql
-- Returns true if user can grade the course:
--   - System admin, OR
--   - Site admin of the course's site, OR  
--   - Teacher assigned to course with can_grade=true
select
  public.is_system_admin()
  or exists (site_admin check)
  or exists (
    select 1 from public.course_teachers t
    where t.course_id = target_course
      and t.profile_id = auth.uid()
      and t.can_grade
  );
```
**Usage:** Fine-grained grading permission. Used correctly for grades write and attendance write.

## Summary of Changes

### Migration: `20261109120000_fix_rls_policies.sql`

**Fixed:**
1. **Terms write policy** - Enforces site_id checks for site-specific terms
2. **Attendance read/write policies** - Enforces enrollment→course→site isolation
3. **Grades read policy** - Restricts to assigned teachers only (not all site teachers)

**Properties:**
- Idempotent (uses `DROP POLICY IF EXISTS`)
- No data migration required
- Uses existing helper functions (consistent with current architecture)
- Performance neutral (same query patterns as existing policies)

**Not Changed:**
- All district catalog tables (already correct)
- Site/profile/student/course tables (already correct)
- Write policies for grades (already correct)
- Helper functions (no changes needed)

## Verification Status

✅ **Audit complete** - All tables reviewed  
✅ **Migration created** - Fixes all identified issues  
✅ **Documentation complete** - MIGRATION_VERIFICATION.md includes test cases  
✅ **Code committed** - Branch: cursor/fix-rls-policies-fd7b  
✅ **Code pushed** - Ready for PR review  
⚠️ **PR creation blocked** - Requires repository collaborator access

## Recommended Next Steps

1. **Create the PR** (see PR_DETAILS.md for content)
2. **Apply to staging/dev** environment first
3. **Run verification queries** (see MIGRATION_VERIFICATION.md)
4. **Test application functionality** with the new policies
5. **Apply to production** after successful testing
6. **Do NOT store real student data** until this migration is applied

## FERPA Compliance Notes

**Before this fix:**
- ❌ Cross-site data access was possible (attendance table)
- ❌ Unauthorized staff could modify terms for other schools
- ⚠️ Teachers could view grades outside their assigned courses

**After this fix:**
- ✅ All student data (students, grades, attendance) is isolated by site
- ✅ Role-based access is properly enforced (system admin > site admin > teacher)
- ✅ Course assignment is required for viewing grades and editing attendance
- ✅ Site admins can only manage their own site's data

**Remaining considerations** (outside scope of this PR):
- Audit logging for data access/exports (not yet implemented)
- Encryption at rest (relies on host defaults)
- Parent/student portal access controls (feature does not exist yet)
