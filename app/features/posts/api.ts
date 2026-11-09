import { http } from "~/lib/http";
import { postSchema, postListItemSchema, type CreatePostInput, type Post, type PostListItem, type UpdatePostInput } from "./schemas";
import { z } from "zod";

export type { Post, PostListItem, CreatePostInput, UpdatePostInput };

export async function listPosts(): Promise<PostListItem[]> {
  const res = await http.get("/posts");
  return z.array(postListItemSchema).parse(res.data);
}

export async function getPost(id: string): Promise<Post> {
  const res = await http.get(`/posts/${id}`);
  return postSchema.parse(res.data);
}

export async function createPost(body: CreatePostInput): Promise<Post> {
  const res = await http.post("/posts", body);
  return postSchema.parse(res.data);
}

export async function updatePost(id: string, body: UpdatePostInput): Promise<Post> {
  const res = await http.patch(`/posts/${id}`, body);
  return postSchema.parse(res.data);
}

export async function deletePost(id: string): Promise<void> {
  await http.delete(`/posts/${id}`);
}

