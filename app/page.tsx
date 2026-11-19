import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, homePath } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { GraduationCap, FileText, Upload, Users, Shield, Printer } from "lucide-react";

export const metadata = {
  title: "Student Report Cards - K-12 Report Card & Grade Tracking",
  description:
    "Secure report card and grade-tracking tool for K-12 schools and academies. Import students, staff, courses, and grades from CSV. Generate printable report cards with customizable templates.",
  openGraph: {
    title: "Student Report Cards - K-12 Report Card & Grade Tracking",
    description:
      "Secure report card and grade-tracking tool for K-12 schools and academies. Import students, staff, courses, and grades from CSV. Generate printable report cards with customizable templates.",
    url: "https://studentreportcards.com",
    siteName: "Student Report Cards",
    type: "website",
  },
};

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect(homePath(user));
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-8 text-primary" />
              <h1 className="font-heading text-2xl">Student Report Cards</h1>
            </div>
            <Link href="/login" className={buttonVariants()}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-muted/30 to-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl">
                Modern Report Card Management
                <br />
                for K-12 Schools
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Streamline your grade tracking and report card generation. Designed for
                K-12 schools and academies with secure, role-based access for
                administrators and teachers.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login" className={buttonVariants({ size: "lg" })}>
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="font-heading text-center text-3xl sm:text-4xl">
              Everything you need for report cards
            </h3>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<Upload />}
                title="CSV Import"
                description="Bulk import students, staff, courses, and grades from CSV files. Fast setup for the entire school year."
              />
              <Feature
                icon={<FileText />}
                title="Customizable Templates"
                description="Create report card templates tailored to your school's needs. Support for multiple grading scales and formats."
              />
              <Feature
                icon={<Printer />}
                title="Printable Report Cards"
                description="Generate professional, print-ready report cards for students. Multiple formats supported."
              />
              <Feature
                icon={<Users />}
                title="Role-Based Access"
                description="Secure access control for administrators and teachers. Each role sees only what they need."
              />
              <Feature
                icon={<Shield />}
                title="Secure & Private"
                description="Your student data stays secure with enterprise-grade encryption and compliance with education data standards."
              />
              <Feature
                icon={<GraduationCap />}
                title="Multi-Site Support"
                description="Perfect for districts managing multiple school sites. Centralized administration with site-level control."
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="font-heading text-3xl sm:text-4xl">
                Built for Schools
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Student Report Cards is designed specifically for K-12 educational
                institutions. We understand the unique needs of school
                administrators and teachers.
              </p>
              <div className="mt-10">
                <p className="text-sm text-muted-foreground">
                  Questions? Contact us at{" "}
                  <a
                    href="mailto:hello@studentreportcards.com"
                    className="text-primary hover:underline"
                  >
                    hello@studentreportcards.com
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Placeholder contact email – please confirm)
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 Student Report Cards. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h4 className="font-heading mt-4 text-lg">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
