import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { DashboardHomePage } from "@/features/dashboard/pages/DashboardHomePage";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { ProjectDetailPage } from "@/features/projects/pages/ProjectDetailPage";
import { TourEditorPage } from "@/features/editor/pages/TourEditorPage";
import { AnalyticsPage } from "@/features/analytics/pages/AnalyticsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "reset-password", element: <ResetPasswordPage /> },
          { path: "auth/callback", element: <AuthCallbackPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: "dashboard", element: <DashboardHomePage /> },
              { path: "dashboard/projects", element: <ProjectsPage /> },
              { path: "dashboard/projects/:projectId", element: <ProjectDetailPage /> },
              { path: "dashboard/tours/:tourId/edit", element: <TourEditorPage /> },
              { path: "dashboard/analytics", element: <AnalyticsPage /> },
              { path: "dashboard/settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
