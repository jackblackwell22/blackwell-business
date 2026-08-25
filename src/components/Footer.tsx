import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer({
  acceptingEnquiries,
}: {
  acceptingEnquiries: boolean;
}) {
  return (
    <footer className="mt-16 border-t border-line bg-brick text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-lg">{SITE_NAME}</p>
          <p className="mt-1 text-sm text-cream-dark">
            Family-run lettings
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href="/properties" className="hover:underline">
            Properties
          </Link>
          <Link href="/location" className="hover:underline">
            Location
          </Link>
          {acceptingEnquiries ? (
            <Link href="/enquire" className="hover:underline">
              Enquire
            </Link>
          ) : null}
          <Link href="/tenants" className="hover:underline">
            For tenants
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/admin/login" className="hover:underline">
            Owners’ desk
          </Link>
        </nav>
      </div>
    </footer>
  );
}
