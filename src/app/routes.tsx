import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { RootLayout } from "@/layouts/RootLayout";

// Phase 3 will add the real auth pages (login, signup, reset-password, etc.)
// under the <AuthLayout> route below. Phase 4+ will add dashboard pages
// under <DashboardLayout>. Both layouts are wired up now so those phases
// only need to add child routes.

function HomePlaceholder() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">OnboardFlow</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePlaceholder />,
      },
      {
        element: <AuthLayout />,
        children: [
          // Phase 3: /login, /signup, /reset-password
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          // Phase 4+: /dashboard, /projects, /tours, etc.
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
