import { isSupabaseConfigured } from "@/lib/auth/config";
import { LoginForm } from "./login-form";

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
              ? "Demo mode is on. Click an account below, then continue. Password is demo."
              : "Use the email and password from your Northside account."}
          </p>
          <LoginForm demo={demo} error={error} />
        </div>
      </div>
    </div>
  );
}
