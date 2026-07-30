// Angular integration example for @onboardflow/sdk.
//
// Wrap the SDK singleton in an injectable service so it can be initialized
// once (e.g. in AppComponent) and consumed anywhere via dependency injection.

import { Injectable } from "@angular/core";
import OnboardFlow, { type OnboardFlowUser } from "@onboardflow/sdk";

@Injectable({ providedIn: "root" })
export class OnboardFlowService {
  private initialized = false;

  init(publicKey: string): void {
    if (this.initialized) return;
    this.initialized = true;
    void OnboardFlow.init({ publicKey });
  }

  identify(userId: string, traits?: Partial<OnboardFlowUser>): void {
    OnboardFlow.identify(userId, traits);
  }

  track(eventName: string, properties?: Record<string, unknown>): void {
    OnboardFlow.track(eventName, properties);
  }

  startTour(tourId: string): void {
    OnboardFlow.start(tourId);
  }
}

// --- app.component.ts ---
//
// import { Component, OnInit } from "@angular/core";
// import { OnboardFlowService } from "./onboardflow.service";
//
// @Component({ selector: "app-root", templateUrl: "./app.component.html" })
// export class AppComponent implements OnInit {
//   constructor(private onboardFlow: OnboardFlowService) {}
//
//   ngOnInit() {
//     this.onboardFlow.init("pk_...");
//   }
// }

// --- Anywhere else via DI ---
//
// constructor(private onboardFlow: OnboardFlowService) {}
//
// onInviteClick() {
//   this.onboardFlow.track("cta_clicked", { cta: "invite_teammate" });
// }
