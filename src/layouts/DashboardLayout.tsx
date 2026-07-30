import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">OnboardFlow</span>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b px-4" />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
