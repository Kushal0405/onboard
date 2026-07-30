import { RouterProvider } from "react-router-dom";

import { QueryProvider } from "@/app/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/app/routes";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
