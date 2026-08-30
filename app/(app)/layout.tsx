import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/auth/session";
import { listSites } from "@/lib/data/repo";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sites = await listSites();
  return (
    <AppShell user={user} sites={sites}>
      {children}
    </AppShell>
  );
}
