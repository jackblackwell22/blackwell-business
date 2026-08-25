import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Page not found</h1>
      <p className="mt-4 text-muted">
        That address is not part of {SITE_NAME}.
      </p>
      <p className="mt-6">
        <Link href="/" className="font-semibold text-door hover:underline">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
