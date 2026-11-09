import { z } from "zod";

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const postListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
});

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required"),
});

export const updatePostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long").optional(),
  content: z.string().min(1, "Content is required").optional(),
});

export type Post = z.infer<typeof postSchema>;
export type PostListItem = z.infer<typeof postListItemSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

