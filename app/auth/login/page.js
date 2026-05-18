import { AuthForm } from "@/components/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await redirectAuthenticatedUser();
  return <AuthForm mode="login" />;
}
