# React #441 Root Cause & Fix

## The Real Error (from Vercel logs)

```
Error: Demo mode is disabled in production. Configure Supabase environment variables to use real authentication and data storage.
```

**35 occurrences** on routes `/sites/[siteId]`, `/sites/[siteId].rsc`, `/district`
Last occurrence: `2026-11-19T21:53Z`
Thrown from: `lib/data/repo.ts` (functions minified as `aN` / `Q` / `R`)

## What Happened

After successful login, the app tried to load the dashboard but failed because:

1. User logged in successfully → auth cookies set ✅
2. Browser redirected to `/district` or `/sites/{siteId}` ✅
3. `(app)/layout.tsx` called `listSites()` ✅
4. `listSites()` called `getBootstrap()` ✅
5. **`getBootstrap()` ALWAYS called `loadState()`** ❌
6. `loadState()` ALWAYS called `assertDemoModeAllowed()` ❌
7. `assertDemoModeAllowed()` checked `NODE_ENV === 'production'` → **threw error** ❌

## The Bug

`getBootstrap()` in `lib/data/repo.ts` **did not check if Supabase was configured**.

### BEFORE (broken):
```typescript
export async function getBootstrap() {
  const user = await requireUser();
  const state = loadState();  // <-- ALWAYS uses file store, even when Supabase exists!
  const sites = user.isSystemAdmin
    ? state.sites
    : state.sites.filter((s) => user.memberships.some((m) => m.siteId === s.id));
  return { user, sites, years: state.years, gradeLevels: state.gradeLevels };
}
```

Every other function in `repo.ts` followed the pattern:
```typescript
if (isSupabaseConfigured()) {
  // use Supabase
} else {
  // use loadState() for demo mode
}
```

But `getBootstrap()` always used `loadState()`, causing production to attempt demo mode.

## The Fix

### AFTER (correct):
```typescript
export async function getBootstrap() {
  const user = await requireUser();
  
  if (isSupabaseConfigured()) {
    // Fetch from Supabase tables
    const supabase = await createServerSupabase();
    const [sitesResult, yearsResult, gradeLevelsResult] = await Promise.all([
      supabase.from("sites").select("*"),
      supabase.from("academic_years").select("*"),
      supabase.from("grade_levels").select("*"),
    ]);
    // ... map results and return
  }
  
  // Only use file store if Supabase is NOT configured (demo mode)
  const state = loadState();
  // ...
}
```

Now `getBootstrap()` follows the same pattern as all other repo functions:
- **If Supabase configured**: use Supabase tables
- **If not**: use `loadState()` (which throws in production, as intended)

## Environment Variables

Production has these set on Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Production only)

`isSupabaseConfigured()` checks the first two:
```typescript
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

**No new env vars required.** The fix uses existing env vars correctly.

## Testing

✅ **Typecheck**: `pnpm exec tsc --noEmit` passes  
✅ **Build**: `pnpm build` succeeds  
✅ **Pattern**: Matches all other repo functions

## Compare Link

https://github.com/lupsanchezortiz/student-grade-tracker/compare/main...cursor/fix-react-441-login-redirect-e9a9

## Why the Incorrect First Attempt?

The Supabase `setAll()` try/catch I removed is the **standard @supabase/ssr pattern** for handling Server Components (where cookies can't be set). Removing it would break session refresh in Server Components.

The actual bug was that the data layer never checked if Supabase was configured before trying to use demo mode.
