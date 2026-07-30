// React integration example for @onboardflow/sdk.
//
// The SDK is a plain singleton (not a React-specific package), so React
// usage is just "call it from an effect." This file shows the recommended
// pattern: init once at the app root, identify whenever your auth state
// resolves, and expose a small hook for components that need to fire
// custom track() calls or manually start a tour (e.g. a "Restart tour"
// button in a help menu).

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import OnboardFlow from "@onboardflow/sdk";

interface OnboardFlowProviderProps {
  publicKey: string;
  children: ReactNode;
}

const OnboardFlowContext = createContext(OnboardFlow);

/**
 * Mount once near the root of your app (e.g. in App.tsx), inside your auth
 * provider so `user` below is available once resolved.
 */
export function OnboardFlowProvider({ publicKey, children }: OnboardFlowProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void OnboardFlow.init({ publicKey });
  }, [publicKey]);

  return <OnboardFlowContext.Provider value={OnboardFlow}>{children}</OnboardFlowContext.Provider>;
}

/** Use from any component to fire custom events or control tours manually. */
export function useOnboardFlow() {
  return useContext(OnboardFlowContext);
}

// --- Example usage elsewhere in your app ---
//
// function App() {
//   return (
//     <OnboardFlowProvider publicKey="pk_...">
//       <AuthProvider>
//         <Dashboard />
//       </AuthProvider>
//     </OnboardFlowProvider>
//   );
// }
//
// function Dashboard() {
//   const { user } = useAuth();
//   const onboardFlow = useOnboardFlow();
//
//   useEffect(() => {
//     if (user) onboardFlow.identify(user.id, { email: user.email, plan: user.plan });
//   }, [user, onboardFlow]);
//
//   return (
//     <button onClick={() => onboardFlow.track("cta_clicked", { cta: "invite_teammate" })}>
//       Invite a teammate
//     </button>
//   );
// }
