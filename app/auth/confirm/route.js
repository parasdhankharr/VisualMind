import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/dashboard";
  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = next.startsWith("/") ? next : "/dashboard";
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = "/auth/login";
  errorUrl.searchParams.set("error", "We could not verify your email. Please try logging in again.");
  errorUrl.searchParams.delete("token_hash");
  errorUrl.searchParams.delete("type");
  errorUrl.searchParams.delete("next");

  return NextResponse.redirect(errorUrl);
}
