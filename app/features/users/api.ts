import { http } from "@/lib/http";
import {
  userListItemSchema,
  userProfileSchema,
  type AssignRoleInput,
  type UserListItem,
  type UserProfile,
} from "./schemas";
import { z } from "zod";

export type { AssignRoleInput, UserListItem, UserProfile };

export async function getMe(): Promise<UserProfile> {
  const res = await http.get("/users/me");
  return userProfileSchema.parse(res.data);
}

export async function listUsers(): Promise<UserListItem[]> {
  const res = await http.get("/users");
  return z.array(userListItemSchema).parse(res.data);
}

export async function assignRole(
  userId: string,
  body: AssignRoleInput,
): Promise<void> {
  await http.post(`/users/${userId}/roles`, body);
}

export async function revokeRole(userId: string, role: string): Promise<void> {
  await http.delete(`/users/${userId}/roles/${role}`);
}
