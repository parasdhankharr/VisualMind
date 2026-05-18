import { AppShell } from "@/components/app-shell";
import { ProfileDetails } from "@/components/profile-details";

export const metadata = {
  title: "Profile | VisualMind",
  description: "View your learning accomplishments, statistics, and earned badges."
};

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Student Account"
      title="User Profile"
      description="Track your visual focus accomplishments, streaks, and account settings."
    >
      <ProfileDetails />
    </AppShell>
  );
}
