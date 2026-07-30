import { fetchPublishedTours } from "./api";
import { recordEvent, type AnalyticsEventType } from "./analytics";
import { clearStep, renderStep, type StepButtonAction } from "./renderer";
import { getOrCreateAnonymousId, markStepCompleted, readCompletedStepIds } from "./storage";
import type { GetTourResponse, OnboardFlowUser, PublicTour } from "./types";

export type { GetTourResponse, OnboardFlowUser, PublicTour, PublicStep, StepContent } from "./types";
export type { AnalyticsEventType } from "./analytics";

export interface OnboardFlowInitOptions {
  publicKey: string;
  apiBase?: string;
  autoStart?: boolean;
}

interface ActiveTourState {
  tour: PublicTour;
  stepIndex: number;
}

const TRACKABLE_EVENT_TYPES: ReadonlySet<string> = new Set([
  "tour_started",
  "tour_completed",
  "tour_dismissed",
  "step_viewed",
  "step_completed",
  "step_skipped",
  "cta_clicked",
]);

class OnboardFlowSDK {
  private publicKey: string | null = null;
  private apiBase: string | undefined;
  private user: OnboardFlowUser | null = null;
  private toursResponse: GetTourResponse | null = null;
  private active: ActiveTourState | null = null;
  private initPromise: Promise<void> | null = null;

  async init(options: OnboardFlowInitOptions): Promise<void> {
    this.publicKey = options.publicKey;
    this.apiBase = options.apiBase;

    this.initPromise = fetchPublishedTours(this.publicKey, this.apiBase)
      .then((response) => {
        this.toursResponse = response;
      })
      .catch((error) => {
        console.error("[OnboardFlow] Failed to load tours:", error);
      });

    await this.initPromise;

    console.log(
      `[OnboardFlow] SDK initialized on ${window.location.href} — ${this.toursResponse?.tours.length ?? 0} published tour(s) loaded`,
    );

    if (options.autoStart !== false && this.toursResponse?.tours.length) {
      const firstIncomplete = this.toursResponse.tours.find(
        (tour) => readCompletedStepIds(tour.id).size < tour.steps.length,
      );
      if (firstIncomplete) this.start(firstIncomplete.id);
    }
  }

  identify(userId: string, traits: Record<string, unknown> = {}): void {
    this.user = { id: userId, ...traits };
  }

  updateUser(traits: Record<string, unknown>): void {
    if (!this.user) {
      console.warn("[OnboardFlow] updateUser called before identify(); ignoring.");
      return;
    }
    this.user = { ...this.user, ...traits };
  }

  /**
   * Fires a tracking event. Delivery requires an active tour (events are
   * scoped to tourId/tourVersionId in analytics_events), so calls outside a
   * tour context (before start(), or for arbitrary custom event names) are
   * logged locally but not sent — analytics_events has no room for
   * tour-less events by design (see Phase 2 schema).
   */
  track(eventName: string, properties: Record<string, unknown> = {}): void {
    const userId = this.user?.id ?? getOrCreateAnonymousId();

    if (!this.publicKey || !this.active || !TRACKABLE_EVENT_TYPES.has(eventName)) {
      console.debug("[OnboardFlow] track (local only)", eventName, { userId, ...properties });
      return;
    }

    const stepId = typeof properties.stepId === "string" ? properties.stepId : null;
    const metadata = { ...properties };
    delete metadata.stepId;

    recordEvent({
      publicKey: this.publicKey,
      endUserId: userId,
      eventType: eventName as AnalyticsEventType,
      tourId: this.active.tour.id,
      tourVersionId: this.active.tour.tourVersionId,
      stepId,
      metadata,
      apiBase: this.apiBase,
    });
  }

  start(tourId: string): void {
    const tour = this.toursResponse?.tours.find((t) => t.id === tourId);
    if (!tour) {
      console.warn(`[OnboardFlow] Tour "${tourId}" not found or not published.`);
      return;
    }
    if (tour.steps.length === 0) {
      console.warn(`[OnboardFlow] Tour "${tourId}" has no steps.`);
      return;
    }

    const completed = readCompletedStepIds(tourId);
    const startIndex = tour.steps.findIndex((step) => !completed.has(step.id));
    this.active = { tour, stepIndex: startIndex === -1 ? 0 : startIndex };
    this.track("tour_started", { tourId });
    this.renderActiveStep();
  }

  stop(): void {
    if (this.active) {
      this.track("tour_dismissed", { tourId: this.active.tour.id });
    }
    this.active = null;
    clearStep();
  }

  show(): void {
    if (this.active) this.renderActiveStep();
  }

  hide(): void {
    clearStep();
  }

  destroy(): void {
    clearStep();
    this.active = null;
    this.toursResponse = null;
    this.user = null;
    this.publicKey = null;
  }

  private renderActiveStep(): void {
    if (!this.active) return;
    const { tour, stepIndex } = this.active;
    const step = tour.steps[stepIndex];
    if (!step) {
      this.completeTour();
      return;
    }

    this.track("step_viewed", { tourId: tour.id, stepId: step.id, stepIndex });

    renderStep(step, stepIndex, tour.steps.length, {
      onButtonAction: (action) => this.handleButtonAction(action),
      onDismiss: () => this.stop(),
    });
  }

  private handleButtonAction(action: StepButtonAction): void {
    if (!this.active) return;
    const { tour, stepIndex } = this.active;
    const step = tour.steps[stepIndex];
    if (!step) return;

    markStepCompleted(tour.id, step.id);
    this.track("step_completed", { tourId: tour.id, stepId: step.id, action });

    if (action === "dismiss") {
      this.stop();
      return;
    }

    if (action === "previous" && stepIndex > 0) {
      this.active = { tour, stepIndex: stepIndex - 1 };
      this.renderActiveStep();
      return;
    }

    if (action === "finish") {
      this.completeTour();
      return;
    }

    // "next" (or any other action) advances to the next step.
    if (stepIndex + 1 < tour.steps.length) {
      this.active = { tour, stepIndex: stepIndex + 1 };
      this.renderActiveStep();
    } else {
      this.completeTour();
    }
  }

  private completeTour(): void {
    if (this.active) {
      this.track("tour_completed", { tourId: this.active.tour.id });
    }
    this.active = null;
    clearStep();
  }
}

export const OnboardFlow = new OnboardFlowSDK();
export default OnboardFlow;
