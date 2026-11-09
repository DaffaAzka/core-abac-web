import { z } from "zod";

export const userListItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.string(),
  roles: z.array(z.string()),
});

export const assignRoleSchema = z.object({
  role: z.string().min(1).max(64),
});

export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

