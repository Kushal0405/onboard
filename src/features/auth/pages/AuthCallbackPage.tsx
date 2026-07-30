import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase/client";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error || !data.session) {
        toast.error(error?.message ?? "Sign-in failed. Please try again.");
        navigate("/login", { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <p>Signing you in...</p>
    </div>
  );
}
