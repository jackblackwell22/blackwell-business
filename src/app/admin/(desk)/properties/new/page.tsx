import { requireOwner } from "@/lib/auth";
import { PropertyForm } from "../PropertyForm";

export const metadata = { title: "Add a property" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  return (
    <div>
      <h1 className="font-display text-4xl">Add a property</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Use this for a shop, a flat, or another lock-up. Leave boxes empty if
        you do not have the detail yet.
      </p>
      <PropertyForm error={params.error} />
    </div>
  );
}
