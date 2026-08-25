import {
  LANDLORDS,
  PROPERTY_TYPES,
  isPropertyType,
  propertyDisplayName,
  type PropertyType,
} from "./constants";
import {
  getDb,
  type EnquiryRow,
  type InvoiceRow,
  type LandlordRow,
  type PropertyRow,
} from "./db";
import { isoNow } from "./london";
import { isLandlordId } from "./references";

export type OccupiedProperty = PropertyRow & {
  tenant_id: number | null;
  tenant_name: string | null;
  rent_pence: number | null;
};

export function listLandlords() {
  const db = getDb();
  return LANDLORDS.map((landlord) => {
    const row = db
      .prepare(`SELECT * FROM landlords WHERE id = ?`)
      .get(landlord.id) as LandlordRow;
    return row;
  });
}

export function updateLandlord(
  id: string,
  fields: {
    postal_address: string;
    bacs_account_name: string;
    bacs_sort_code: string;
    bacs_account_number: string;
    from_email: string;
  },
) {
  getDb()
    .prepare(
      `UPDATE landlords
       SET postal_address = ?, bacs_account_name = ?, bacs_sort_code = ?,
           bacs_account_number = ?, from_email = ?
       WHERE id = ?`,
    )
    .run(
      fields.postal_address.trim(),
      fields.bacs_account_name.trim(),
      fields.bacs_sort_code.trim(),
      fields.bacs_account_number.trim(),
      fields.from_email.trim(),
      id,
    );
}

function propertyOrderSql() {
  return `CASE p.type WHEN 'lock-up' THEN 0 WHEN 'shop' THEN 1 WHEN 'flat' THEN 2 ELSE 3 END, p.sort_order, p.label COLLATE NOCASE, p.id`;
}

export function listProperties() {
  return getDb()
    .prepare(
      `SELECT p.*, t.id AS tenant_id, t.name AS tenant_name, tn.rent_pence
       FROM properties p
       LEFT JOIN tenancies tn ON tn.property_id = p.id AND tn.ended_at IS NULL
       LEFT JOIN tenants t ON t.id = tn.tenant_id
       ORDER BY ${propertyOrderSql()}`,
    )
    .all() as OccupiedProperty[];
}

export function listPublicProperties() {
  return getDb()
    .prepare(
      `SELECT id, type, label, address
       FROM properties
       ORDER BY CASE type WHEN 'lock-up' THEN 0 WHEN 'shop' THEN 1 WHEN 'flat' THEN 2 ELSE 3 END, sort_order, label COLLATE NOCASE, id`,
    )
    .all() as Pick<PropertyRow, "id" | "type" | "label" | "address">[];
}

export function getProperty(id: number) {
  return (
    (getDb()
      .prepare(`SELECT * FROM properties WHERE id = ?`)
      .get(id) as PropertyRow | undefined) ?? null
  );
}

export function createProperty(fields: {
  type: PropertyType;
  label: string;
  address: string;
  landlord_id: string | null;
}) {
  const label = fields.label.trim();
  if (!label) throw new Error("Enter a label for this property.");
  const sortOrder = Number.parseInt(label, 10);
  const info = getDb()
    .prepare(
      `INSERT INTO properties (type, label, address, landlord_id, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      fields.type,
      label,
      fields.address.trim(),
      fields.landlord_id,
      Number.isFinite(sortOrder) ? sortOrder : 1000,
      isoNow(),
    );
  return Number(info.lastInsertRowid);
}

export function updateProperty(
  id: number,
  fields: {
    type: PropertyType;
    label: string;
    address: string;
    landlord_id: string | null;
  },
) {
  const label = fields.label.trim();
  if (!label) throw new Error("Enter a label for this property.");
  const sortOrder = Number.parseInt(label, 10);
  getDb()
    .prepare(
      `UPDATE properties
       SET type = ?, label = ?, address = ?, landlord_id = ?, sort_order = ?
       WHERE id = ?`,
    )
    .run(
      fields.type,
      label,
      fields.address.trim(),
      fields.landlord_id,
      Number.isFinite(sortOrder) ? sortOrder : 1000,
      id,
    );
}

export function setPropertyLandlord(id: number, landlordId: string | null) {
  if (landlordId !== null && !isLandlordId(landlordId)) {
    throw new Error("Unknown landlord");
  }
  getDb()
    .prepare(`UPDATE properties SET landlord_id = ? WHERE id = ?`)
    .run(landlordId, id);
}

export function listTenants() {
  const db = getDb();
  const tenants = db
    .prepare(`SELECT * FROM tenants ORDER BY name COLLATE NOCASE`)
    .all() as {
    id: number;
    name: string;
    email: string;
    notes: string;
    created_at: string;
  }[];
  const lets = db
    .prepare(
      `SELECT tn.tenant_id, tn.property_id, tn.rent_pence, p.type, p.label
       FROM tenancies tn
       JOIN properties p ON p.id = tn.property_id
       WHERE tn.ended_at IS NULL
       ORDER BY ${propertyOrderSql()}`,
    )
    .all() as {
    tenant_id: number;
    property_id: number;
    rent_pence: number;
    type: string;
    label: string;
  }[];
  return tenants.map((tenant) => ({
    ...tenant,
    properties: lets.filter((row) => row.tenant_id === tenant.id),
  }));
}

export function getTenant(id: number) {
  const tenant = getDb()
    .prepare(`SELECT * FROM tenants WHERE id = ?`)
    .get(id) as
    | {
        id: number;
        name: string;
        email: string;
        notes: string;
        created_at: string;
      }
    | undefined;
  if (!tenant) return null;
  const properties = getDb()
    .prepare(
      `SELECT tn.property_id, tn.rent_pence, p.type, p.label
       FROM tenancies tn
       JOIN properties p ON p.id = tn.property_id
       WHERE tn.tenant_id = ? AND tn.ended_at IS NULL
       ORDER BY ${propertyOrderSql()}`,
    )
    .all(id) as {
    property_id: number;
    rent_pence: number;
    type: string;
    label: string;
  }[];
  return { ...tenant, properties };
}

export function createTenant(fields: {
  name: string;
  email: string;
  notes: string;
}) {
  const info = getDb()
    .prepare(
      `INSERT INTO tenants (name, email, notes, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(fields.name.trim(), fields.email.trim(), fields.notes.trim(), isoNow());
  return Number(info.lastInsertRowid);
}

export function updateTenant(
  id: number,
  fields: { name: string; email: string; notes: string },
) {
  getDb()
    .prepare(`UPDATE tenants SET name = ?, email = ?, notes = ? WHERE id = ?`)
    .run(fields.name.trim(), fields.email.trim(), fields.notes.trim(), id);
}

export function assignProperties(
  tenantId: number,
  assignments: { property_id: number; rent_pence: number }[],
) {
  const db = getDb();
  const wanted = new Set(assignments.map((item) => item.property_id));
  const tx = db.transaction(() => {
    const current = db
      .prepare(
        `SELECT id, property_id FROM tenancies WHERE tenant_id = ? AND ended_at IS NULL`,
      )
      .all(tenantId) as { id: number; property_id: number }[];

    for (const row of current) {
      if (!wanted.has(row.property_id)) {
        db.prepare(`UPDATE tenancies SET ended_at = ? WHERE id = ?`).run(
          isoNow(),
          row.id,
        );
      }
    }

    for (const item of assignments) {
      const property = db
        .prepare(`SELECT id, type, label FROM properties WHERE id = ?`)
        .get(item.property_id) as
        | { id: number; type: string; label: string }
        | undefined;
      if (!property) {
        throw new Error("That property is not on the list.");
      }

      const occupant = db
        .prepare(
          `SELECT tenant_id FROM tenancies
           WHERE property_id = ? AND ended_at IS NULL`,
        )
        .get(item.property_id) as { tenant_id: number } | undefined;
      if (occupant && occupant.tenant_id !== tenantId) {
        throw new Error(
          `${propertyDisplayName(property.type, property.label)} is already let to another tenant.`,
        );
      }

      const existing = current.find((row) => row.property_id === item.property_id);
      if (existing) {
        db.prepare(`UPDATE tenancies SET rent_pence = ? WHERE id = ?`).run(
          item.rent_pence,
          existing.id,
        );
      } else {
        db.prepare(
          `INSERT INTO tenancies (tenant_id, property_id, rent_pence, started_at, ended_at)
           VALUES (?, ?, ?, ?, NULL)`,
        ).run(tenantId, item.property_id, item.rent_pence, isoNow());
      }
    }
  });
  tx();
}

export function listEnquiries() {
  return getDb()
    .prepare(`SELECT * FROM enquiries ORDER BY id DESC`)
    .all() as EnquiryRow[];
}

export function addEnquiry(fields: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO enquiries (name, email, phone, message, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      fields.name.trim(),
      fields.email.trim(),
      fields.phone.trim(),
      fields.message.trim(),
      isoNow(),
    );
}

export function listInvoices(year?: number, month?: number) {
  const db = getDb();
  if (year && month) {
    return db
      .prepare(
        `SELECT i.*, t.name AS tenant_name, l.name AS landlord_name
         FROM invoices i
         JOIN tenants t ON t.id = i.tenant_id
         JOIN landlords l ON l.id = i.landlord_id
         WHERE i.year = ? AND i.month = ?
         ORDER BY i.id DESC`,
      )
      .all(year, month) as (InvoiceRow & {
      tenant_name: string;
      landlord_name: string;
    })[];
  }
  return db
    .prepare(
      `SELECT i.*, t.name AS tenant_name, l.name AS landlord_name
       FROM invoices i
       JOIN tenants t ON t.id = i.tenant_id
       JOIN landlords l ON l.id = i.landlord_id
       ORDER BY i.year DESC, i.month DESC, i.id DESC`,
    )
    .all() as (InvoiceRow & { tenant_name: string; landlord_name: string })[];
}

export function getInvoice(id: number) {
  return (
    (getDb()
      .prepare(
        `SELECT i.*, t.name AS tenant_name, t.email AS tenant_email, l.name AS landlord_name
         FROM invoices i
         JOIN tenants t ON t.id = i.tenant_id
         JOIN landlords l ON l.id = i.landlord_id
         WHERE i.id = ?`,
      )
      .get(id) as
      | (InvoiceRow & {
          tenant_name: string;
          tenant_email: string;
          landlord_name: string;
        })
      | undefined) ?? null
  );
}

export function invoiceLines(invoiceId: number) {
  return getDb()
    .prepare(
      `SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY id`,
    )
    .all(invoiceId) as {
    id: number;
    invoice_id: number;
    property_id: number;
    description: string;
    amount_pence: number;
  }[];
}

export function groupedPublicProperties() {
  const rows = listPublicProperties();
  return PROPERTY_TYPES.map((type) => ({
    type,
    properties: rows.filter((row) => isPropertyType(row.type) && row.type === type),
  }));
}
