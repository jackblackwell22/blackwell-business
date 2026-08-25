"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canOpenDevDesk,
  clearOwnerSession,
  getOwnerAccounts,
  requireOwner,
  setOwnerSession,
  verifyOwnerLogin,
} from "@/lib/auth";
import { LANDLORDS, isPropertyType } from "@/lib/constants";
import { emailInvoice, runMonthlyInvoices } from "@/lib/invoices";
import { penceFromPoundsInput } from "@/lib/money";
import {
  assignProperties,
  createProperty,
  createTenant,
  listProperties,
  updateLandlord,
  updateProperty,
  updateTenant,
} from "@/lib/queries";
import { isLandlordId } from "@/lib/references";
import { setAcceptingEnquiries } from "@/lib/settings";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const owner = verifyOwnerLogin(username, password);
  if (!owner) {
    redirect("/admin/login?error=1");
  }
  await setOwnerSession(owner);
  redirect("/admin");
}

export async function logoutAction() {
  await clearOwnerSession();
  redirect("/admin/login");
}

export async function openOwnersDeskAction() {
  if (!canOpenDevDesk()) {
    redirect("/admin/login?error=1");
  }
  const accounts = getOwnerAccounts();
  await setOwnerSession(accounts[0].id);
  redirect("/admin");
}

export async function saveAcceptingAction(formData: FormData) {
  await requireOwner();
  setAcceptingEnquiries(formData.get("accepting") === "on");
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
}

export async function saveLandlordsAction(formData: FormData) {
  await requireOwner();
  for (const landlord of LANDLORDS) {
    updateLandlord(landlord.id, {
      postal_address: String(formData.get(`${landlord.id}_postal_address`) ?? ""),
      bacs_account_name: String(formData.get(`${landlord.id}_bacs_account_name`) ?? ""),
      bacs_sort_code: String(formData.get(`${landlord.id}_bacs_sort_code`) ?? ""),
      bacs_account_number: String(
        formData.get(`${landlord.id}_bacs_account_number`) ?? "",
      ),
      from_email: String(formData.get(`${landlord.id}_from_email`) ?? ""),
    });
  }
  setAcceptingEnquiries(formData.get("accepting") === "on");
  revalidatePath("/", "layout");
  revalidatePath("/admin/properties");
  redirect("/admin/properties?saved=1");
}

function landlordFromForm(raw: string) {
  if (raw === "" || raw === "unset") return null;
  if (isLandlordId(raw)) return raw;
  return null;
}

export async function savePropertyAction(formData: FormData) {
  await requireOwner();
  const idRaw = String(formData.get("id") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const address = String(formData.get("address") ?? "");
  const landlord_id = landlordFromForm(String(formData.get("landlord_id") ?? ""));

  if (!isPropertyType(typeRaw) || !label) {
    const target = idRaw ? `/admin/properties/${idRaw}` : "/admin/properties/new";
    redirect(`${target}?error=missing`);
  }

  try {
    if (!idRaw) {
      createProperty({ type: typeRaw, label, address, landlord_id });
    } else {
      updateProperty(Number(idRaw), { type: typeRaw, label, address, landlord_id });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save";
    const target = idRaw ? `/admin/properties/${idRaw}` : "/admin/properties/new";
    redirect(`${target}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/admin");
  redirect("/admin/properties?saved=1");
}

function assignmentsFromForm(formData: FormData) {
  const properties = listProperties();
  const assignments: { property_id: number; rent_pence: number }[] = [];
  for (const property of properties) {
    if (formData.get(`property_${property.id}`) !== "on") continue;
    const pence = penceFromPoundsInput(
      String(formData.get(`rent_${property.id}`) ?? ""),
    );
    if (pence === null) {
      throw new Error(`Enter the monthly rent for ${property.label}.`);
    }
    assignments.push({ property_id: property.id, rent_pence: pence });
  }
  return assignments;
}

export async function saveTenantAction(formData: FormData) {
  await requireOwner();
  const idRaw = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) {
    const target = idRaw ? `/admin/tenants/${idRaw}` : "/admin/tenants/new";
    redirect(`${target}?error=name`);
  }

  let id = Number(idRaw);
  try {
    const assignments = assignmentsFromForm(formData);
    if (!idRaw) {
      id = createTenant({ name, email, notes });
    } else {
      updateTenant(id, { name, email, notes });
    }
    assignProperties(id, assignments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save";
    const target = idRaw ? `/admin/tenants/${idRaw}` : "/admin/tenants/new";
    redirect(`${target}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/tenants");
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  redirect(`/admin/tenants/${id}?saved=1`);
}

export async function generateThisMonthAction() {
  await requireOwner();
  await runMonthlyInvoices();
  revalidatePath("/admin");
  revalidatePath("/admin/invoices");
  redirect("/admin?generated=1");
}

export async function resendInvoiceAction(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  await emailInvoice(id);
  revalidatePath("/admin");
  revalidatePath("/admin/invoices");
  const fromThisMonth = String(formData.get("from") ?? "") === "this-month";
  redirect(fromThisMonth ? `/admin?resent=${id}` : `/admin/invoices?resent=${id}`);
}
