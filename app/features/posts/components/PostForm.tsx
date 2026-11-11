import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPostSchema, type CreatePostInput } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PostFormProps {
  defaultValues?: Partial<CreatePostInput>;
  submitLabel: string;
  submitting?: boolean;
  fieldErrors?: Partial<Record<keyof CreatePostInput, string>>;
  generalError?: string;
  onSubmit: (data: CreatePostInput) => void;
  onCancel?: () => void;
}

export function PostForm({
  defaultValues = { title: "", content: "" },
  submitLabel,
  submitting = false,
  fieldErrors,
  generalError,
  onSubmit,
  onCancel,
}: PostFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: defaultValues.title ?? "",
      content: defaultValues.content ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {generalError && (
        <div
          role="alert"
          className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
          {generalError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Attributes in Modern ABAC"
          aria-invalid={!!errors.title || !!fieldErrors?.title}
          aria-describedby={
            errors.title || fieldErrors?.title ? "title-error" : undefined
          }
          {...register("title")}
        />
        {(errors.title || fieldErrors?.title) && (
          <p id="title-error" className="text-xs text-destructive">
            {errors.title?.message || fieldErrors?.title}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={8}
          placeholder="Write the post content here…"
          aria-invalid={!!errors.content || !!fieldErrors?.content}
          aria-describedby={
            errors.content || fieldErrors?.content ? "content-error" : undefined
          }
          {...register("content")}
        />
        {(errors.content || fieldErrors?.content) && (
          <p id="content-error" className="text-xs text-destructive">
            {errors.content?.message || fieldErrors?.content}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
