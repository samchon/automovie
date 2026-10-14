import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage.js";

/**
 * Observe capture stages without cancelling valid work because time passed. The capture lifetime tracks explicit transport failure and host-reported settlement; this observer cannot release its queue slot early or measure OS/GPU termination.
 *
 * @evidence contracts/common.md#principled-implementation Running stages expose actual start/progress timestamps and clear only their own current record when their producing work settles.
 * @evidence contracts/common.md#clear-and-simple-design One current stage reference separates observation from the capture lifetime and queue owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time never cancels work or releases its logical queue slot; an older settling operation cannot clear a newer current stage.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns transport failure and host-reported settlement to the lifetime owner and distinguishes these records from independent native termination observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed stage-field updates introduce no input-sized traversal or processing choice.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each run observes a distinct operation and cannot reuse another run's progress as actual measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one current record remains until its matching run settles; no observer timer or historical stage collection is retained.
 */
export function createHumanViewerStageWatch(): {
  run: <Value>(name: string, doc: string, work: () => Promise<Value>) => Promise<Value>;
  progress: () => void;
  current: () => IHumanViewerCaptureStage | null;
} {
  let current: IHumanViewerCaptureStage | null = null;
  return {
    /** Observe one stage until its producing operation settles. */
    run: async <Value>(
      name: string,
      doc: string,
      work: () => Promise<Value>,
    ): Promise<Value> => {
      const now: string = new Date().toISOString();
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
