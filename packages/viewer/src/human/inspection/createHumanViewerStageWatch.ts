import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage.js";

/**
 * Observe the running capture's stages without cancelling valid work because
 * time passed. The capture lifetime owns explicit transport failure and
 * physical settlement; this observer cannot release its queue slot early.
 *
 * @evidence contracts/common.md#principled-implementation Awaiting the actual operation preserves queue ownership until completion or the capture lifetime's failure.
 * @evidence contracts/common.md#clear-and-simple-design One observer owns the current stage without a second cancellation policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records actual stage and progress timestamps while leaving timeout, cancellation and renderer ownership outside this observer.
 * @evidence contracts/common.md#meaningful-documentation Separates progress telemetry from transport cancellation.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Awaiting the actual operation preserves queue ownership until completion or the capture lifetime's failure.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One observer owns the current stage without a second cancellation policy.
 */
export function createHumanViewerStageWatch() {
  let current: IHumanViewerCaptureStage | null = null;
  return {
    /** Observe one stage until its producing operation settles. */
    run: async <Value>(
      name: string,
      doc: string,
      work: () => Promise<Value>,
    ): Promise<Value> => {
      const now = new Date().toISOString();
      const stage: IHumanViewerCaptureStage = {
        name,
        doc,
        since: now,
        progress: now,
      };
      current = stage;
      try {
        return await work();
      } finally {
        if (current === stage) current = null;
      }
    },

    /** The running stage reported progress. */
    progress: (): void => {
      if (current !== null) current.progress = new Date().toISOString();
    },

    /** The stage running now, or null between captures. */
    current: (): IHumanViewerCaptureStage | null => current,
  };
}
