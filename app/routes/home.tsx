import { redirect } from "react-router";
import type { Route } from "./+types/home";

export async function clientLoader(): Promise<Response> {
  return redirect("/posts");
}

export default function HomePage() {
  return null;
}
