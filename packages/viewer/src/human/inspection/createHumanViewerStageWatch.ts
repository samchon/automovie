import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage.js";

/**
 * Observe the running capture's stages without cancelling valid work because
 * time passed. The capture lifetime owns explicit transport failure and
 * physical settlement; this observer cannot release its queue slot early.
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
