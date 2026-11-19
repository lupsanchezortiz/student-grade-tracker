import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Student Report Cards",
  description: "Privacy policy for Student Report Cards",
};

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">
            <em>
              Note: This is a template privacy policy. Please review and customize
              this content with your legal counsel before use. This is not legal
              advice.
            </em>
          </p>
          <p>
            <strong>Last Updated:</strong> November 19, 2026
          </p>

          <h2>Introduction</h2>
          <p>
            Student Report Cards (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting
            the privacy and security of student information. This Privacy Policy
            describes how we collect, use, and protect information when schools use
            our report card and grade-tracking service.
          </p>

          <h2>Information We Collect</h2>
          <h3>Student Information</h3>
          <p>
            Schools may upload the following types of student information to our
            service:
          </p>
          <ul>
            <li>Student names and identification numbers</li>
            <li>Grade levels and course enrollments</li>
            <li>Academic grades and performance data</li>
            <li>Report card records</li>
          </ul>

          <h3>School Staff Information</h3>
          <p>We collect information about school staff members, including:</p>
          <ul>
            <li>Names and email addresses</li>
            <li>School and district affiliation</li>
            <li>Role (administrator, teacher, etc.)</li>
          </ul>

          <h3>Technical Information</h3>
          <p>
            We automatically collect certain technical information when you use our
            service, including:
          </p>
          <ul>
            <li>Log data (IP addresses, browser type, pages visited)</li>
            <li>Authentication and session information</li>
            <li>Usage patterns and performance data</li>
          </ul>

          <h2>How We Use Information</h2>
          <p>We use the information we collect solely to:</p>
          <ul>
            <li>Provide report card generation and grade-tracking services</li>
            <li>
              Enable authorized school staff to access and manage student grades
            </li>
            <li>Maintain and improve the security and performance of our service</li>
            <li>
              Comply with legal obligations and respond to lawful requests from
              authorities
            </li>
          </ul>

          <h2>Data Ownership and Control</h2>
          <p>
            <strong>Schools own their data.</strong> Student information uploaded by
            a school remains the property of that school. We act as a service
            provider processing data on behalf of the school.
          </p>
          <p>Schools have the right to:</p>
          <ul>
            <li>Access all their data at any time</li>
            <li>Export their data in standard formats</li>
            <li>Request deletion of their data</li>
            <li>Control which staff members have access to the system</li>
          </ul>

          <h2>Data Sharing and Disclosure</h2>
          <p>
            <strong>We do not sell student data.</strong> We do not use student data
            for advertising purposes. We do not share student information with third
            parties except:
          </p>
          <ul>
            <li>
              With service providers who help us operate our platform (e.g.,
              hosting, database services), under strict confidentiality agreements
            </li>
            <li>
              When required by law or to respond to valid legal process (e.g.,
              court orders, subpoenas)
            </li>
            <li>To protect the rights, property, or safety of our users or others</li>
            <li>
              With the school&apos;s explicit consent for a specific purpose
            </li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures to protect student
            information, including:
          </p>
          <ul>
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Encrypted data storage with Supabase</li>
            <li>Role-based access controls</li>
            <li>Regular security assessments</li>
            <li>Secure authentication mechanisms</li>
          </ul>
          <p>
            While we strive to protect your information, no method of transmission
            or storage is 100% secure. Schools should implement their own security
            practices when using our service.
          </p>

          <h2>Data Storage and Location</h2>
          <p>
            Student data is stored securely using Supabase, a database platform that
            implements industry-standard security practices. Data is stored in
            secure data centers with appropriate physical and technical safeguards.
          </p>

          <h2>FERPA Compliance</h2>
          <p>
            We understand that schools using our service may be subject to the
            Family Educational Rights and Privacy Act (FERPA). We will:
          </p>
          <ul>
            <li>
              Treat all student information as education records protected under
              FERPA
            </li>
            <li>
              Use student information only for the purposes authorized by the school
            </li>
            <li>
              Not re-disclose student information without the school&apos;s consent,
              except as required by law
            </li>
            <li>
              Maintain reasonable security safeguards to protect student information
            </li>
            <li>
              Destroy or return student information when it is no longer needed for
              the authorized purpose
            </li>
          </ul>

          <h2>Data Retention and Deletion</h2>
          <p>
            We retain student information only as long as necessary to provide
            services to the school or as required by law. Schools may request
            deletion of their data at any time by contacting us.
          </p>
          <p>
            When a school requests data deletion, we will permanently delete all
            student information associated with that school within 30 days, except
            where retention is required by law.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Our service is designed for use by schools and is not directed to
            children. We do not knowingly collect personal information directly from
            children. Schools are responsible for obtaining any necessary parental
            consents before providing student information to us.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            schools of any material changes by email or through our service. The
            &quot;Last Updated&quot; date at the top of this policy indicates when it was most
            recently revised.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us at:
          </p>
          <p>
            <a
              href="mailto:lupsanchezortiz@gmail.com"
              className="text-primary hover:underline"
            >
              lupsanchezortiz@gmail.com
            </a>
          </p>

          <h2>Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your
            personal information, including:
          </p>
          <ul>
            <li>The right to access your information</li>
            <li>The right to correct inaccurate information</li>
            <li>The right to request deletion of your information</li>
            <li>The right to restrict or object to certain processing</li>
            <li>The right to data portability</li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email address above.
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
