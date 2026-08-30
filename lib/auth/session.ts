import { cookies } from "next/headers";
import { isSupabaseConfigured, SESSION_COOKIE } from "@/lib/auth/config";
import { loadState } from "@/lib/data/store";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_system_admin")
      .eq("id", user.id)
      .maybeSingle();
    const { data: memberships } = await supabase
      .from("site_memberships")
      .select("site_id, role")
      .eq("profile_id", user.id);
    return {
      id: user.id,
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? user.email ?? "User",
      isSystemAdmin: Boolean(profile?.is_system_admin),
      memberships: (memberships ?? []).map((m) => ({
        siteId: m.site_id as string,
        role: m.role as SessionUser["memberships"][number]["role"],
      })),
    };
  }

  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const state = loadState();
  const profile = state.profiles.find((p) => p.id === id);
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    isSystemAdmin: profile.isSystemAdmin,
    memberships: state.memberships
      .filter((m) => m.profileId === profile.id)
      .map((m) => ({ siteId: m.siteId, role: m.role })),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("You need to sign in.");
  }
  return user;
}

export function canManageDistrict(user: SessionUser) {
  return user.isSystemAdmin;
}

export function canManageSite(user: SessionUser, siteId: string) {
  if (user.isSystemAdmin) return true;
  return user.memberships.some(
    (m) => m.siteId === siteId && m.role === "site_admin",
  );
}

export function canViewSite(user: SessionUser, siteId: string) {
  if (user.isSystemAdmin) return true;
  return user.memberships.some((m) => m.siteId === siteId);
}

export function homePath(user: SessionUser) {
  if (user.isSystemAdmin) return "/district";
  const first = user.memberships[0];
  if (first) return `/sites/${first.siteId}`;
  return "/district";
}
