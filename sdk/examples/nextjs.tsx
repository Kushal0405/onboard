// Next.js (App Router) integration example for @onboardflow/sdk.
//
// The SDK touches `window`/`document`/`localStorage`, so it must only run
// client-side. Two things matter: mark the init component "use client", and
// don't call OnboardFlow.init() during render (SSR has no window at all) —
// only from inside useEffect, which never runs on the server.

// app/onboardflow-init.tsx
"use client";

import { useEffect, useRef } from "react";
import OnboardFlow from "@onboardflow/sdk";

export function OnboardFlowInit({ publicKey }: { publicKey: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void OnboardFlow.init({ publicKey });
  }, [publicKey]);

  return null;
}

// app/layout.tsx
//
// import { OnboardFlowInit } from "./onboardflow-init";
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <OnboardFlowInit publicKey={process.env.NEXT_PUBLIC_ONBOARDFLOW_KEY!} />
//         {children}
//       </body>
//     </html>
//   );
// }
//
// Alternative for the App Router: `next/script` with `strategy="lazyOnload"`
// works too if you'd rather load the CDN build instead of the npm package —
// see the vanilla example's <script> snippet for the exact tags.
