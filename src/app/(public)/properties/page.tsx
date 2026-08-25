import type { Metadata } from "next";
import { EnquireCta } from "@/components/EnquireCta";
import { SitePhoto } from "@/components/SitePhoto";
import {
  SEEDED_LOCK_UP_LABELS,
  SITE_PLACE,
  SITE_STREET,
  propertyDisplayName,
  propertyTypeGroupTitle,
} from "@/lib/constants";
import { groupedPublicProperties } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Properties",
};

function emptyCopy(type: "lock-up" | "shop" | "flat") {
  if (type === "lock-up") return "No lock-up garages are listed yet.";
  if (type === "shop") return "No shops are listed yet.";
  return "No flats are listed yet.";
}

export default function PropertiesPage() {
  const accepting = isAcceptingEnquiries();
  const groups = groupedPublicProperties();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Properties</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Blackwell lets lock-up garages, commercial shops, and private flats.
        Groups with nothing on the books stay empty on purpose — we do not
        invent addresses or units.
      </p>

      <div className="mt-8">
        <SitePhoto caption="The Swan Street lock-ups, photographed on the street." />
      </div>

      {groups.map((group) => (
        <section key={group.type} className="mt-12">
          <h2 className="font-display text-3xl">{propertyTypeGroupTitle(group.type)}</h2>
          {group.properties.length === 0 ? (
            <p className="mt-4 max-w-2xl rounded-md border border-line bg-paper px-4 py-3 text-muted">
              {emptyCopy(group.type)}
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.properties.map((property) => {
                const knownSwanStreet =
                  group.type === "lock-up" &&
                  (SEEDED_LOCK_UP_LABELS as readonly string[]).includes(
                    property.label,
                  );
                const address = property.address.trim();
                return (
                  <li
                    key={property.id}
                    className="rounded-lg border border-line bg-paper px-5 py-6"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-brick">
                      {group.type === "lock-up"
                        ? "Lock-up"
                        : group.type === "shop"
                          ? "Shop"
                          : "Flat"}
                    </p>
                    <p className="mt-1 font-display text-3xl text-door">
                      {propertyDisplayName(property.type, property.label)}
                    </p>
                    {address ? (
                      <p className="mt-2 text-sm text-muted">{address}</p>
                    ) : knownSwanStreet ? (
                      <p className="mt-2 text-sm text-muted">
                        {SITE_STREET}, {SITE_PLACE}.
                      </p>
                    ) : null}
                    {knownSwanStreet ? (
                      <p className="mt-2 text-sm text-muted">
                        Traditional lock-up with bright blue wooden double doors.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      <div className="mt-12">
        {accepting ? (
          <EnquireCta accepting />
        ) : (
          <p className="max-w-2xl rounded-md border border-line bg-paper px-4 py-3 text-muted">
            We are not taking new enquiries at the moment.
          </p>
        )}
      </div>
    </div>
  );
}
