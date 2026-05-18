import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/supabase/shared";

let browserClient;

export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = assertSupabaseEnv();
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
