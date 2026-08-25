import { PROPERTY_TYPES, propertyTypeLabel } from "@/lib/constants";
import { savePropertyAction } from "../../actions";

export function PropertyForm({
  property,
  error,
}: {
  property?: {
    id: number;
    type: string;
    label: string;
    address: string;
    landlord_id: string | null;
  };
  error?: string;
}) {
  return (
    <form action={savePropertyAction} className="mt-6 space-y-5 rounded-lg border border-line bg-paper p-6">
      {property ? <input type="hidden" name="id" value={property.id} /> : null}
      {error ? (
        <p className="rounded-md bg-brick/10 px-4 py-3 text-sm text-brick-dark" role="alert">
          {error === "missing"
            ? "Choose a type and enter a label."
            : error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold">Type</span>
        <select
          name="type"
          defaultValue={property?.type ?? "lock-up"}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        >
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {propertyTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Label</span>
        <input
          name="label"
          required
          defaultValue={property?.label}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        />
        <span className="mt-1 block text-sm text-muted">
          For a Swan Street lock-up this is the unit number, such as 7. For a
          shop or flat, type the name you use.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Address (optional)</span>
        <textarea
          name="address"
          rows={3}
          defaultValue={property?.address}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Landlord</span>
        <select
          name="landlord_id"
          defaultValue={property?.landlord_id ?? "unset"}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        >
          <option value="unset">Not set</option>
          <option value="jack">Jack Blackwell</option>
          <option value="david">David Blackwell</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
      >
        Save property
      </button>
    </form>
  );
}
