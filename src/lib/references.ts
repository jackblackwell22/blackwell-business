import { LANDLORDS, MONTH_CODES, type LandlordId } from "./constants";

export function landlordCode(id: string): string {
  return (
    LANDLORDS.find((landlord) => landlord.id === id)?.code ??
    id.slice(0, 1).toUpperCase()
  );
}

export function monthCode(year: number, month: number) {
  const code = MONTH_CODES[month - 1] ?? String(month).padStart(2, "0");
  return `${code}${String(year).slice(-2)}`;
}

export function sanitizeRefPart(label: string) {
  const compact = label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return compact || "X";
}

/**
 * Unique BACS-style reference, e.g. BLK-J-7-8-SEP26.
 * Stays short enough for ordinary UK bank payment references.
 */
export function paymentReference(
  landlordId: LandlordId | string,
  labels: string[],
  year: number,
  month: number,
  uniqueSuffix?: string,
) {
  const code = landlordCode(landlordId);
  const period = monthCode(year, month);
  const parts = [...labels]
    .map(sanitizeRefPart)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en"));
  const longForm = `BLK-${code}-${parts.join("-")}-${period}`;
  if (longForm.length <= 18 && !uniqueSuffix) return longForm;

  const shortParts = parts.join("").slice(0, 6);
  const compact = uniqueSuffix
    ? `BLK-${code}${period}-${uniqueSuffix}`
    : `BLK-${code}-${shortParts}-${period}`;
  if (compact.length <= 18) return compact;
  return `BLK-${code}${period}${uniqueSuffix ?? shortParts}`.slice(0, 18);
}

export function isLandlordId(value: string): value is LandlordId {
  return value === "jack" || value === "david";
}
