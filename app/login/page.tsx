import { loginAction } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { DEMO_ACCOUNTS } from "@/lib/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demo = !isSupabaseConfigured();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-between bg-sidebar px-8 py-10 text-sidebar-foreground lg:max-w-lg lg:px-12">
        <div>
          <p className="text-sm tracking-wide text-sidebar-foreground/60 uppercase">
            Northside Unified School District
          </p>
          <h1 className="font-heading mt-4 text-4xl leading-tight">
            Gradebooks that start from the report card.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/70">
            District office sets the year, the scale, and what is graded. Schools
            enroll students, teachers mark the grid, and families get a card in
            English or Spanish.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/45">
          Maple Elementary · Cedar Ridge K–8
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="font-heading text-2xl">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {demo
              ? "Demo mode is on. Use any account below with password demo."
              : "Use the email and password from your Northside account."}
          </p>
          {error ? (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error === "missing"
                ? "Enter your email and password."
                : "That email or password is not recognized."}
            </p>
          ) : null}
          <form action={loginAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={demo ? DEMO_ACCOUNTS[0].email : ""}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                defaultValue={demo ? "demo" : ""}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
          {demo ? (
            <ul className="mt-8 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <p className="font-medium">{account.name}</p>
                  <p className="text-muted-foreground">{account.role}</p>
                  <p className="mt-1 font-mono text-xs">{account.email}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
