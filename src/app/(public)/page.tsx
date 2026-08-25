import Link from "next/link";
import { EnquireCta } from "@/components/EnquireCta";
import { SitePhoto } from "@/components/SitePhoto";
import { SEEDED_LOCK_UP_LABELS, SITE_PLACE, SITE_STREET } from "@/lib/constants";
import { groupedPublicProperties } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";

export default function HomePage() {
  const accepting = isAcceptingEnquiries();
  const groups = groupedPublicProperties();
  const lockUps = groups.find((group) => group.type === "lock-up")?.properties ?? [];
  const shopCount = groups.find((group) => group.type === "shop")?.properties.length ?? 0;
  const flatCount = groups.find((group) => group.type === "flat")?.properties.length ?? 0;
  const firstUnit = SEEDED_LOCK_UP_LABELS[0];
  const lastUnit = SEEDED_LOCK_UP_LABELS[SEEDED_LOCK_UP_LABELS.length - 1];

  return (
    <div>
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brick">
              Family-run lettings
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Lock-ups, shops, and flats, looked after by the family who owns them.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Blackwell lets a short row of lock-up garages on {SITE_STREET} in{" "}
              {SITE_PLACE}, and commercial shops and private flats when they are
              on the books. This is a family site, not a warehouse or an estate
              agent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <EnquireCta accepting={accepting} />
              <Link
                href="/properties"
                className="inline-flex rounded-md border border-door px-5 py-3 font-semibold text-door hover:bg-cream"
              >
                See the properties
              </Link>
            </div>
            {!accepting ? (
              <p className="mt-6 max-w-xl rounded-md border border-line bg-cream px-4 py-3 text-sm text-muted">
                We are not taking new enquiries at the moment. Please check back
                another time.
              </p>
            ) : null}
          </div>
          <SitePhoto
            priority
            caption="The Swan Street lock-ups: bright blue wooden doors in the original brick."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Lock-up garages</h2>
            <p className="mt-3 text-muted">
              Units {firstUnit} to {lastUnit} on {SITE_STREET} are listed
              here{lockUps.length > SEEDED_LOCK_UP_LABELS.length
                ? ", along with any other lock-ups added later"
                : ""}.
              They are ordinary lock-ups with wooden double doors — not
              self-storage.
            </p>
            <Link href="/properties" className="mt-4 inline-block font-semibold text-door hover:underline">
              Properties
            </Link>
          </article>
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Shops and flats</h2>
            <p className="mt-3 text-muted">
              {shopCount === 0 && flatCount === 0
                ? "No shops or flats are listed on this site yet. When they are added, they will appear on the properties page."
                : shopCount === 0
                  ? `${flatCount === 1 ? "One flat is" : `${flatCount} flats are`} listed. No shops are listed yet.`
                  : flatCount === 0
                    ? `${shopCount === 1 ? "One shop is" : `${shopCount} shops are`} listed. No flats are listed yet.`
                    : `${shopCount === 1 ? "One shop" : `${shopCount} shops`} and ${flatCount === 1 ? "one flat" : `${flatCount} flats`} are listed.`}
            </p>
            <Link href="/properties" className="mt-4 inline-block font-semibold text-door hover:underline">
              Properties
            </Link>
          </article>
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">If you already rent</h2>
            <p className="mt-3 text-muted">
              Rent is invoiced each month. Pay by bank transfer using the
              reference printed on the invoice.
            </p>
            <Link href="/tenants" className="mt-4 inline-block font-semibold text-door hover:underline">
              For tenants
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
