import * as React from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSubmit,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "./+types/sign-up";
import { signUp, storeToken } from "../api";
import { signUpSchema, type SignUpInput } from "../schemas";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { isApiError } from "~/lib/errors";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Create account" }];
}

export const handle = { breadcrumb: "Sign up" };

type ActionData = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof SignUpInput, string>>;
};

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ActionData | Response> {
  const form = await request.formData();
  const raw = {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  };
  const parsed = signUpSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof SignUpInput;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please correct the form errors.", fieldErrors };
  }

  try {
    const result = await signUp(parsed.data);
    storeToken(result.token);
    return redirect("/posts");
  } catch (err) {
    if (isApiError(err)) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Failed to register account." };
  }
}

export default function SignUpPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: SignUpInput) => {
    submit(data as Record<string, string>, { method: "post" });
  };

  return (
    <div className="space-y-6 animate-page">
      <div className="space-y-1">
        <h1 className="text-xl font-display font-semibold text-foreground">
          Create account
        </h1>
        <p className="text-xs text-muted-foreground">
          Register a new profile on find-cat-ely
        </p>
      </div>

      {actionData && !actionData.ok && !actionData.fieldErrors && (
        <div
          role="alert"
          className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
          {actionData.error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alice Doe"
            aria-invalid={!!errors.name || !!actionData?.fieldErrors?.name}
            aria-describedby={
              errors.name || actionData?.fieldErrors?.name ?
                "name-error"
              : undefined
            }
            {...register("name")}
          />
          {(errors.name || actionData?.fieldErrors?.name) && (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name?.message || actionData?.fieldErrors?.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="alice@example.com"
            aria-invalid={!!errors.email || !!actionData?.fieldErrors?.email}
            aria-describedby={
              errors.email || actionData?.fieldErrors?.email ?
                "email-error"
              : undefined
            }
            {...register("email")}
          />
          {(errors.email || actionData?.fieldErrors?.email) && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email?.message || actionData?.fieldErrors?.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={
              !!errors.password || !!actionData?.fieldErrors?.password
            }
            aria-describedby={
              errors.password || actionData?.fieldErrors?.password ?
                "password-error"
              : undefined
            }
            {...register("password")}
          />
          {(errors.password || actionData?.fieldErrors?.password) && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password?.message || actionData?.fieldErrors?.password}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-8">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          to="/sign-in"
          className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
