import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export async function redirectAuthenticatedUser(destination = "/dashboard") {
  const user = await getAuthUser();

  if (user) {
    redirect(destination);
  }
}

export async function requireAuth(destination = "/auth/login") {
  const user = await getAuthUser();

  if (!user) {
    redirect(destination);
  }

  return user;
}
