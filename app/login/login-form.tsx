"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { DEMO_ACCOUNTS } from "@/lib/data/demo-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  demo,
  error,
}: {
  demo: boolean;
  error?: string;
}) {
  const [email, setEmail] = useState(demo ? DEMO_ACCOUNTS[0].email : "");

  return (
    <>
      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error === "missing"
            ? "Enter your email and password."
            : "That email or password is not recognized."}
        </p>
      ) : null}
      <form action={loginAction} className="mt-6 space-y-4" autoComplete="off">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
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
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
      {demo ? (
        <ul className="mt-8 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => setEmail(account.email)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <p className="font-medium">{account.name}</p>
                <p className="text-muted-foreground">{account.role}</p>
                <p className="mt-1 font-mono text-xs">{account.email}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
