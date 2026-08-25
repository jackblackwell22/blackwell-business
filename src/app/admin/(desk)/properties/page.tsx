import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import {
  LANDLORDS,
  propertyDisplayName,
  propertyTypeGroupTitle,
  type PropertyType,
} from "@/lib/constants";
import { listLandlords, listProperties } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";
import { saveLandlordsAction } from "../../actions";

export const metadata = { title: "Properties" };

const GROUP_ORDER: PropertyType[] = ["lock-up", "shop", "flat"];

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  const properties = listProperties();
  const landlords = listLandlords();
  const accepting = isAcceptingEnquiries();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Properties</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Add lock-ups, shops, and flats. Leave landlord as “Not set” until you
            know. Address, bank details and from-email belong to that landlord
            only — nothing is invented.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="rounded-md bg-door px-4 py-2 text-sm font-semibold text-white hover:bg-door-dark"
        >
          Add a property
        </Link>
      </div>
      {params.saved === "1" ? (
        <p className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-sm">
          Saved.
        </p>
      ) : null}

      {GROUP_ORDER.map((type) => {
        const rows = properties.filter((property) => property.type === type);
        return (
          <section key={type} className="mt-8">
            <h2 className="font-display text-2xl">{propertyTypeGroupTitle(type)}</h2>
            {rows.length === 0 ? (
              <p className="mt-3 text-sm text-muted">None yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream-dark/60">
                    <tr>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Landlord</th>
                      <th className="px-4 py-3">Let to</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((property) => (
                      <tr key={property.id} className="border-t border-line">
                        <td className="px-4 py-3 font-semibold">
                          {propertyDisplayName(property.type, property.label)}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {property.address.trim() || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {LANDLORDS.find((l) => l.id === property.landlord_id)
                            ?.name ?? "Not set"}
                        </td>
                        <td className="px-4 py-3">
                          {property.tenant_name ?? "Vacant"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/properties/${property.id}`}
                            className="font-semibold text-door hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      <form action={saveLandlordsAction} className="mt-12 space-y-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {landlords.map((landlord) => (
            <section
              key={landlord.id}
              className="space-y-3 rounded-lg border border-line bg-paper p-5"
            >
              <h2 className="font-display text-2xl">{landlord.name}</h2>
              <label className="block text-sm">
                <span className="font-semibold">Postal address</span>
                <textarea
                  name={`${landlord.id}_postal_address`}
                  rows={4}
                  defaultValue={landlord.postal_address}
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">BACS account name</span>
                <input
                  name={`${landlord.id}_bacs_account_name`}
                  defaultValue={landlord.bacs_account_name}
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Sort code</span>
                <input
                  name={`${landlord.id}_bacs_sort_code`}
                  defaultValue={landlord.bacs_sort_code}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Account number</span>
                <input
                  name={`${landlord.id}_bacs_account_number`}
                  defaultValue={landlord.bacs_account_number}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">From-email</span>
                <input
                  name={`${landlord.id}_from_email`}
                  type="email"
                  defaultValue={landlord.from_email}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
                <span className="mt-1 block text-muted">
                  Used as the From address on this landlord’s invoices when SMTP
                  is set in the environment. Leave blank until you have one.
                </span>
              </label>
            </section>
          ))}
        </div>

        <section className="space-y-3 rounded-lg border border-line bg-paper p-5">
          <h2 className="font-display text-2xl">Enquiries</h2>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="accepting"
              defaultChecked={accepting}
              className="size-4 accent-door"
            />
            Accepting enquiries
          </label>
        </section>

        <button
          type="submit"
          className="rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
        >
          Save landlord details
        </button>
      </form>
    </div>
  );
}
