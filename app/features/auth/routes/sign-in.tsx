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
import type { Route } from "./+types/sign-in";
import { signIn, storeToken } from "../api";
import { signInSchema, type SignInInput } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isApiError } from "@/lib/errors";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Sign in" }];
}

export const handle = { breadcrumb: "Sign in" };

type ActionData = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof SignInInput, string>>;
};

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ActionData | Response> {
  const form = await request.formData();
  const raw = {
    email: form.get("email"),
    password: form.get("password"),
  };
  const parsed = signInSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SignInInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof SignInInput;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please correct the form errors.", fieldErrors };
  }

  try {
    const result = await signIn(parsed.data);
    storeToken(result.token);
    return redirect("/posts");
  } catch (err) {
    if (isApiError(err)) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Sign in failed. Check your credentials." };
  }
}

export default function SignInPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: SignInInput) => {
    submit(data as Record<string, string>, { method: "post" });
  };

  return (
      <Card className="animate-page">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {actionData && !actionData.ok && !actionData.fieldErrors && (
            <div
              role="alert"
              className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
              {actionData.error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="alice@example.com"
                aria-invalid={
                  !!errors.email || !!actionData?.fieldErrors?.email
                }
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
                autoComplete="current-password"
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
                  {errors.password?.message ||
                    actionData?.fieldErrors?.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-8">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-xs text-muted-foreground">
            Need an account?{" "}
            <Link
              to="/sign-up"
              className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
