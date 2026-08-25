import { LogoutButton } from "@/components/auth/logout-button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Profile</h1>
        <p className="text-sm text-gray-400">Account settings and preferences.</p>
      </div>

      <LogoutButton />
    </div>
  );
}