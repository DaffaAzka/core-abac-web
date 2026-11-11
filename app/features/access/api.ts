import { http } from "@/lib/http";
import {
  checkPermissionResponseSchema,
  grantSchema,
  policySchema,
  roleSchema,
  type CheckPermissionInput,
  type CheckPermissionResult,
  type DefinePolicyInput,
  type DefineRoleInput,
  type Grant,
  type GrantInput,
  type Policy,
  type Role,
} from "./schemas";
import { z } from "zod";

export type {
  CheckPermissionInput,
  CheckPermissionResult,
  DefinePolicyInput,
  DefineRoleInput,
  Grant,
  GrantInput,
  Policy,
  Role,
};

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function listRoles(): Promise<Role[]> {
  const res = await http.get("/access/roles");
  return z.array(roleSchema).parse(res.data);
}

export async function defineRole(body: DefineRoleInput): Promise<Role> {
  const res = await http.post("/access/roles", body);
  return roleSchema.parse(res.data);
}

export async function deleteRole(name: string): Promise<void> {
  await http.delete(`/access/roles/${name}`);
}

// ── Policies ──────────────────────────────────────────────────────────────────

export async function listPolicies(): Promise<Policy[]> {
  const res = await http.get("/access/policies");
  return z.array(policySchema).parse(res.data);
}

export async function definePolicy(body: DefinePolicyInput): Promise<Policy> {
  const res = await http.post("/access/policies", body);
  return policySchema.parse(res.data);
}

export async function deletePolicy(id: string): Promise<void> {
  await http.delete(`/access/policies/${id}`);
}

// ── Grants ────────────────────────────────────────────────────────────────────

export async function listGrants(userId: string): Promise<Grant[]> {
  const res = await http.get(`/access/grants/${userId}`);
  return z.array(grantSchema).parse(res.data);
}

export async function grantPermission(
  userId: string,
  body: GrantInput,
): Promise<Grant> {
  const res = await http.post(`/access/grants/${userId}`, body);
  return grantSchema.parse(res.data);
}

export async function denyPermission(
  userId: string,
  body: GrantInput,
): Promise<Grant> {
  const res = await http.post(`/access/grants/${userId}/deny`, body);
  return grantSchema.parse(res.data);
}

export async function revokeGrant(grantId: string): Promise<void> {
  await http.delete(`/access/grants/item/${grantId}`);
}

// ── Permission check ──────────────────────────────────────────────────────────

export async function checkPermission(
  body: CheckPermissionInput,
): Promise<CheckPermissionResult> {
  const res = await http.post("/access/check", body);
  return checkPermissionResponseSchema.parse(res.data);
}
