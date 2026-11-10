export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_MODE === "true";
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function assertDemoModeAllowed() {
  if (isProduction()) {
    throw new Error(
      "Demo mode is disabled in production. Configure Supabase environment variables to use real authentication and data storage.",
    );
  }
  if (!isDemoModeEnabled()) {
    throw new Error(
      "Demo mode is disabled. Set ENABLE_DEMO_MODE=true in your .env.local file to use the local file store, or configure Supabase environment variables for production use.",
    );
  }
}

export const SESSION_COOKIE = "sis_session";
