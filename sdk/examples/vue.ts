// Vue 3 integration example for @onboardflow/sdk.
//
// Two pieces: a plugin that initializes the SDK once on app mount, and a
// composable (`useOnboardFlow`) for components that need to fire custom
// events or control tours manually.

import type { App } from "vue";
import OnboardFlow from "@onboardflow/sdk";

export interface OnboardFlowPluginOptions {
  publicKey: string;
}

export const OnboardFlowPlugin = {
  install(_app: App, options: OnboardFlowPluginOptions) {
    void OnboardFlow.init({ publicKey: options.publicKey });
  },
};

export function useOnboardFlow() {
  return OnboardFlow;
}

// --- main.ts ---
//
// import { createApp } from "vue";
// import App from "./App.vue";
// import { OnboardFlowPlugin } from "./onboardflow";
//
// createApp(App)
//   .use(OnboardFlowPlugin, { publicKey: "pk_..." })
//   .mount("#app");

// --- Inside a component (<script setup>) ---
//
// import { watch } from "vue";
// import { useOnboardFlow } from "./onboardflow";
// import { useAuthStore } from "./stores/auth";
//
// const onboardFlow = useOnboardFlow();
// const auth = useAuthStore();
//
// watch(
//   () => auth.user,
//   (user) => {
//     if (user) onboardFlow.identify(user.id, { email: user.email });
//   },
//   { immediate: true },
// );
