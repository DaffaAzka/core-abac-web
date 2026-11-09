import { z } from "zod";

// ── Shared sub-schemas ────────────────────────────────────────────────────────

export const ruleDefinitionSchema = z.object({
  action: z.union([z.string(), z.array(z.string())]),
  subject: z.union([z.string(), z.array(z.string())]),
  conditions: z.record(z.unknown()).optional(),
  fields: z.array(z.string()).optional(),
  inverted: z.boolean().optional(),
  reason: z.string().optional(),
});

export type RuleDefinition = z.infer<typeof ruleDefinitionSchema>;

// ── Roles ────────────────────────────────────────────────────────────────────

export const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parents: z.array(z.string()),
  rules: z.array(ruleDefinitionSchema),
});

export const defineRoleSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().optional(),
  parents: z.array(z.string()).optional(),
  rules: z.array(ruleDefinitionSchema).optional(),
});

export type Role = z.infer<typeof roleSchema>;
export type DefineRoleInput = z.infer<typeof defineRoleSchema>;

// ── Policies ─────────────────────────────────────────────────────────────────

export const policySchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  priority: z.number(),
  target: z.record(z.unknown()).optional(),
  rules: z.array(ruleDefinitionSchema),
});

export const definePolicySchema = z.object({
  name: z.string().min(1),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
  target: z.record(z.unknown()).optional(),
  rules: z.array(ruleDefinitionSchema),
});

export type Policy = z.infer<typeof policySchema>;
export type DefinePolicyInput = z.infer<typeof definePolicySchema>;

// ── Grants ───────────────────────────────────────────────────────────────────

export const grantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rule: ruleDefinitionSchema,
  expiresAt: z.string().nullable().optional(),
});

export const grantInputSchema = z.object({
  action: z.union([z.string(), z.array(z.string())]),
  subject: z.union([z.string(), z.array(z.string())]),
  resourceId: z.union([z.string(), z.number()]).optional(),
  conditions: z.record(z.unknown()).optional(),
  reason: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
});

export type Grant = z.infer<typeof grantSchema>;
export type GrantInput = z.infer<typeof grantInputSchema>;

// ── Permission check ──────────────────────────────────────────────────────────

export const checkPermissionSchema = z.object({
  action: z.string().min(1),
  subject: z.string().min(1),
  field: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const checkPermissionResponseSchema = z.object({
  allowed: z.boolean(),
  action: z.string(),
  subject: z.string(),
  userId: z.string(),
});

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
export type CheckPermissionResult = z.infer<typeof checkPermissionResponseSchema>;

