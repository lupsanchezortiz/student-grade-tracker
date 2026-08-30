import { redirect } from "next/navigation";
import { getSessionUser, homePath } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(homePath(user));
}
