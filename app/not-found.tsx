import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Northside Unified
      </p>
      <h1 className="font-heading mt-2 text-2xl">That page is not available</h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        The course or school may have been removed, or you do not have access.
      </p>
      <Link href="/" className="mt-6 text-sm text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
