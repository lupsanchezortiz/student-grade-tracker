import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Use - Student Report Cards",
  description: "Terms of use for Student Report Cards",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12">
        <article className="prose prose-sm sm:prose mx-auto max-w-4xl px-4 dark:prose-invert sm:px-6">
          <h1>Terms of Use</h1>
          <p className="text-muted-foreground">
            <em>
              Note: This is a template terms of use document. Please review and
              customize this content with your legal counsel before use. This is not
              legal advice.
            </em>
          </p>
          <p>
            <strong>Last Updated:</strong> November 19, 2026
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Student Report Cards (&quot;the Service&quot;), you agree to
            be bound by these Terms of Use. If you do not agree to these terms,
            please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Student Report Cards provides a web-based platform for K-12 schools and
            educational institutions to manage student grades, generate report
            cards, and track academic performance. The Service is intended for use
            by authorized school administrators and teachers.
          </p>

          <h2>3. Eligibility</h2>
          <p>
            The Service is intended for use by educational institutions and their
            authorized staff members. You must be at least 18 years old and
            authorized by your school or district to use the Service.
          </p>

          <h2>4. User Accounts</h2>
          <p>To use the Service, you must:</p>
          <ul>
            <li>
              Provide accurate and complete registration information
            </li>
            <li>
              Maintain the security of your account credentials
            </li>
            <li>
              Notify us immediately of any unauthorized access to your account
            </li>
            <li>
              Accept responsibility for all activities that occur under your account
            </li>
          </ul>
          <p>
            You may not share your account credentials or allow others to access
            your account.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>
              Access student data you are not authorized to view
            </li>
            <li>
              Use the Service in any way that violates applicable laws or
              regulations
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>
              Interfere with or disrupt the Service or servers or networks connected
              to the Service
            </li>
            <li>
              Use the Service to transmit any viruses, malware, or other harmful
              code
            </li>
            <li>
              Attempt to reverse engineer, decompile, or disassemble any part of the
              Service
            </li>
            <li>
              Use automated means to access the Service without our express written
              permission
            </li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its design, functionality, and content (excluding
            user-uploaded data), is owned by Student Report Cards and is protected
            by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            Schools retain ownership of all student data and content they upload to
            the Service. By uploading data, schools grant us a limited license to
            process and store that data solely for the purpose of providing the
            Service.
          </p>

          <h2>7. Data Responsibilities</h2>
          <p>Schools using the Service are responsible for:</p>
          <ul>
            <li>
              Ensuring they have the legal right to upload and process student data
            </li>
            <li>
              Complying with all applicable privacy laws and regulations, including
              FERPA
            </li>
            <li>
              Obtaining any necessary consents before providing student information
              to us
            </li>
            <li>
              Implementing appropriate security measures for their accounts
            </li>
            <li>
              Training their staff on proper use of the Service
            </li>
          </ul>

          <h2>8. Service Availability</h2>
          <p>
            We strive to provide reliable and continuous access to the Service.
            However, we do not guarantee that the Service will be available at all
            times. The Service may be temporarily unavailable due to maintenance,
            updates, or circumstances beyond our control.
          </p>

          <h2>9. Modifications to Service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the
            Service at any time, with or without notice. We will make reasonable
            efforts to notify schools of significant changes to the Service.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time if we
            believe you have violated these Terms or applicable laws. Schools may
            terminate their use of the Service at any time by contacting us.
          </p>
          <p>
            Upon termination, your right to use the Service will immediately cease.
            Schools may request export or deletion of their data as described in our
            Privacy Policy.
          </p>

          <h2>11. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
            ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
            NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free, or
            free from viruses or other harmful components. You use the Service at
            your own risk.
          </p>

          <h2>12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, STUDENT REPORT CARDS SHALL NOT
            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
            DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
            INTANGIBLE LOSSES.
          </p>

          <h2>13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Student Report Cards from any
            claims, damages, losses, liabilities, and expenses (including reasonable
            attorneys&apos; fees) arising out of your use of the Service or violation of
            these Terms.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify schools of
            material changes by email or through the Service. Your continued use of
            the Service after such notice constitutes acceptance of the updated
            Terms.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the
            laws of the United States, without regard to its conflict of law
            provisions.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at:
          </p>
          <p>
            <a
              href="mailto:hello@studentreportcards.com"
              className="text-primary hover:underline"
            >
              hello@studentreportcards.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            (Placeholder contact email – please confirm)
          </p>

          <h2>17. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire
            agreement between you and Student Report Cards regarding the use of the
            Service.
          </p>
        </article>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 Student Report Cards. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
