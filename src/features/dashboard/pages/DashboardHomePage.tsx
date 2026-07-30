import { useAuth } from "@/features/auth/hooks/useAuth";

export function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome{user?.user_metadata.full_name ? `, ${user.user_metadata.full_name as string}` : ""}</h1>
      <p className="text-muted-foreground">Your workspace dashboard is coming in Phase 5.</p>
    </div>
  );
}
