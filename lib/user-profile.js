import { createClient } from "@/lib/supabase/server";

function fallbackName(authUser) {
  const metadataName =
    authUser?.user_metadata?.name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.display_name;

  if (metadataName) {
    return metadataName;
  }

  return authUser?.email?.split("@")[0] || "Learner";
}

export function serializeUser(dbProfile, authUser) {
  if (!authUser) {
    return null;
  }

  return {
    id: authUser.id,
    authUserId: authUser.id,
    profileId: authUser.id,
    name: dbProfile?.name || fallbackName(authUser),
    email: authUser.email,
    xp: dbProfile?.xp ?? authUser.user_metadata?.xp ?? 0,
    streak: dbProfile?.streak ?? authUser.user_metadata?.streak ?? 0,
    badges: dbProfile?.badges ?? authUser.user_metadata?.badges ?? []
  };
}

export async function syncAuthUserProfile(authUser) {
  if (!authUser?.id || !authUser?.email) {
    return null;
  }

  try {
    const supabase = await createClient();

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!profile) {
      const name = fallbackName(authUser);
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
          id: authUser.id,
          name,
          email: authUser.email,
          xp: 0,
          streak: 0,
          badges: []
        })
        .select()
        .single();

      if (!error && newProfile) {
        profile = newProfile;
      }
    }

    return serializeUser(profile, authUser);
  } catch (error) {
    console.error("Error in syncAuthUserProfile:", error);
    return serializeUser(null, authUser);
  }
}
