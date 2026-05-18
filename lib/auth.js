export async function getAuthUser() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const { syncAuthUserProfile } = await import("@/lib/user-profile");
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return syncAuthUserProfile(user);
  } catch {
    return null;
  }
}
