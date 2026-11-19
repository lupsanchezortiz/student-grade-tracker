# Functions Fixed for Supabase Production Use

## Critical Fix (Dashboard Loading)

### 1. `getBootstrap()` in lib/data/repo.ts
**Status**: ✅ FIXED - Now checks `isSupabaseConfigured()` and fetches from Supabase  
**Called by**: `listSites()` → `(app)/layout.tsx` → Every authenticated page  
**Impact**: This was THE bug causing React #441 on /district and /sites/[siteId]

**Implementation**:
- Queries: sites, academic_years (ordered desc), grade_levels (ordered asc)  
- Proper type mappings: `Site`, `AcademicYear`, `GradeLevel`  
- Error handling: throws on query errors instead of silently using []  
- Schema match: name_en/name_es, sort_order, created_at column names

## Known Limitations (Not on Critical Path)

### CSV Import Functions - NOT FIXED
These functions still call `loadState()` within Supabase code blocks because they need
template and term data that would require significant additional Supabase queries:

- `importCoursesCsv()` - lines 411, 447, 456 call `siteTermStructure()` and `findTemplateForGrade()` 
- `importGradesCsv()` - lines 1127, 1221 similar usage

**Impact**: CSV imports will fail in production with Supabase. Admin users should use
direct Supabase console imports or SQL for bulk operations. These are admin-only
features not used during normal dashboard operations, so they don't block the main fix.

**Future work**: Need to fetch templates and terms from Supabase and refactor helper
functions to work with Supabase data structures.

## Root Cause Summary

**Error**: `Demo mode is disabled in production` (35 occurrences on Vercel)  
**Routes**: `/district`, `/sites/[siteId]`, `/sites/[siteId].rsc`  
**When**: After successful login, during dashboard rendering  
**Why**: `getBootstrap()` always called `loadState()` without checking if Supabase was configured  
**Fix**: Added Supabase check and implementation following the pattern used everywhere else in the codebase
