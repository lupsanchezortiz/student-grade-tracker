"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, SESSION_COOKIE, assertDemoModeAllowed } from "@/lib/auth/config";
import { homePath } from "@/lib/auth/session";
import { loadState } from "@/lib/data/store";
import { createServerSupabase } from "@/lib/supabase/server";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/login?error=missing");
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/login?error=invalid");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?error=invalid");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_system_admin")
      .eq("id", user.id)
      .maybeSingle();
    const { data: memberships } = await supabase
      .from("site_memberships")
      .select("site_id, role")
      .eq("profile_id", user.id);
    redirect(
      homePath({
        id: user.id,
        email: profile?.email ?? email,
        fullName: profile?.full_name ?? email,
        isSystemAdmin: Boolean(profile?.is_system_admin),
        memberships: (memberships ?? []).map((m) => ({
          siteId: m.site_id as string,
          role: m.role as "site_admin" | "teacher",
        })),
      }),
    );
  }

  assertDemoModeAllowed();
  
  const state = loadState();
  const profile = state.profiles.find(
    (p) => p.email.toLowerCase() === email && p.password === password,
  );
  if (!profile) redirect("/login?error=invalid");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, profile.id, cookieOptions());
  redirect(
    homePath({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      isSystemAdmin: profile.isSystemAdmin,
      memberships: state.memberships
        .filter((m) => m.profileId === profile.id)
        .map((m) => ({ siteId: m.siteId, role: m.role })),
    }),
  );
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
