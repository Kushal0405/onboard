import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out");
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">OnboardFlow</span>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b px-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
