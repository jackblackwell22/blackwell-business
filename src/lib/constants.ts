export const PROPERTY_TYPES = ["lock-up", "shop", "flat"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const SEEDED_LOCK_UP_LABELS = ["7", "8", "9", "10", "11", "12"] as const;

export const LANDLORDS = [
  { id: "jack", name: "Jack Blackwell", code: "J" },
  { id: "david", name: "David Blackwell", code: "D" },
] as const;

export type LandlordId = (typeof LANDLORDS)[number]["id"];

export const SITE_NAME = "Blackwell";
export const SITE_DOMAIN = "blackwell.business";
export const SITE_PLACE = "Royal Leamington Spa";
export const SITE_STREET = "Swan Street";
export const SITE_POSTCODE_AREA = "CV32";

/** OpenStreetMap pin for Swan Street itself (not a unit). */
export const OSM = {
  lat: 52.2927812,
  lon: -1.5309665,
  minLon: -1.5335,
  minLat: 52.2913,
  maxLon: -1.5285,
  maxLat: 52.2943,
} as const;

export const MONTH_CODES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export const COOKIE_NAME = "blackwell_desk";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function propertyTypeLabel(type: PropertyType | string) {
  switch (type) {
    case "lock-up":
      return "Lock-up";
    case "shop":
      return "Shop";
    case "flat":
      return "Flat";
    default:
      return type;
  }
}

export function propertyTypeGroupTitle(type: PropertyType) {
  switch (type) {
    case "lock-up":
      return "Lock-up garages";
    case "shop":
      return "Shops";
    case "flat":
      return "Flats";
  }
}

export function propertyDisplayName(type: PropertyType | string, label: string) {
  const trimmed = label.trim();
  if (type === "lock-up") {
    return /^[0-9]+$/.test(trimmed) ? `Lock-up ${trimmed}` : trimmed;
  }
  if (type === "shop") {
    return /^shop\b/i.test(trimmed) ? trimmed : `Shop ${trimmed}`;
  }
  if (type === "flat") {
    return /^flat\b/i.test(trimmed) ? trimmed : `Flat ${trimmed}`;
  }
  return trimmed;
}

export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

export function isLandlordId(value: string): value is LandlordId {
  return value === "jack" || value === "david";
}
