import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { propertyDisplayName } from "@/lib/constants";
import { getProperty } from "@/lib/queries";
import { PropertyForm } from "../PropertyForm";

export const metadata = { title: "Edit property" };

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const query = await searchParams;
  const property = getProperty(Number(id));
  if (!property) notFound();
  return (
    <div>
      <h1 className="font-display text-4xl">
        {propertyDisplayName(property.type, property.label)}
      </h1>
      <PropertyForm property={property} error={query.error} />
    </div>
  );
}
