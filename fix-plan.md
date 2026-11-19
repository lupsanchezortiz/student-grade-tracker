# Real Root Cause

`lib/data/repo.ts` function `getBootstrap()` ALWAYS calls `loadState()`, which ALWAYS calls `assertDemoModeAllowed()`, which throws in production.

```typescript
export async function getBootstrap() {
  const user = await requireUser();
  const state = loadState();  // <-- ALWAYS calls loadState, even when Supabase is configured
  const sites = user.isSystemAdmin
    ? state.sites
    : state.sites.filter((s) => user.memberships.some((m) => m.siteId === s.id));
  return { user, sites, years: state.years, gradeLevels: state.gradeLevels };
}
```

## The Pattern

Other functions in the codebase check `isSupabaseConfigured()` first:
- `listStudents()` → checks, uses Supabase OR file store
- `createStudent()` → checks, uses Supabase OR file store
- etc.

But `getBootstrap()` doesn't check, it always uses file store.

## The Fix

Make `getBootstrap()` check if Supabase is configured:
- If YES: fetch sites, years, gradeLevels from Supabase tables
- If NO: use `loadState()` for demo mode (which will throw in production)

This matches the pattern used everywhere else in the codebase.
