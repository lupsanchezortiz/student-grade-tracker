import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/auth/session";
import { listSites } from "@/lib/data/repo";
import { parseSidebarPref, SIDEBAR_COOKIE } from "@/lib/sidebar-pref";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [sites, jar] = await Promise.all([listSites(), cookies()]);
  const sidebarPref = parseSidebarPref(jar.get(SIDEBAR_COOKIE)?.value);
  return (
    <AppShell user={user} sites={sites} sidebarPref={sidebarPref}>
      {children}
    </AppShell>
  );
}
