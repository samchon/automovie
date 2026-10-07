import { HumanViewerStalledError } from "./HumanViewerStalledError";
import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage";

/**
 * Watch the running capture's stages. Each stage runs against its bound of
 * time without progress; progress is any report the stage's worker makes (a
 * page display stage). A stage that exceeds its bound rejects with
 * `HumanViewerStalledError`, which ends the request and frees its queue slot,
 * and calls `stalled` so the owner can replace a page that stopped. No
 * unknown wait can then hold the queue for good, whatever it waits on.
 *
 * @evidence contracts/common.md#principled-implementation Every stage is bounded by the absence of progress, not by its total length, so long valid builds still finish.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the current stage and its timer.
 * @evidence contracts/common.md#meaningful-documentation States what progress is, what a stall does and why it closes every unknown wait.
 */
export function createHumanViewerStageWatch(
  stalled: (stage: IHumanViewerCaptureStage) => void,
) {
  let current: IHumanViewerCaptureStage | null = null;
  let lastProgress = 0;
  return {
    /** Run one stage; it fails as stalled after `boundMs` without progress. */
    run: <Value>(
      name: string,
      doc: string,
      boundMs: number,
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
      lastProgress = Date.now();
      // Only this run's stage is cleared: a stalled run that settles later
      // must not clear the stage of the capture that took its slot.
      const finish = (): void => {
        clearInterval(timer);
        if (current === stage) current = null;
      };
      let timer: ReturnType<typeof setInterval> | undefined;
      return new Promise<Value>((resolve, reject) => {
        timer = setInterval(
          () => {
            if (current !== stage || Date.now() - lastProgress <= boundMs)
              return;
            finish();
            stalled(stage);
            reject(
              new HumanViewerStalledError(
                `The capture of ${doc} made no progress in its ${name} stage for ` +
                  `${Math.round(boundMs / 1000)} s (since ${stage.progress}); the request was ended and its slot released`,
              ),
            );
          },
          Math.min(1000, boundMs),
        );
        work()
          .then((value) => resolve(value))
          .catch((error: unknown) =>
            reject(error instanceof Error ? error : new Error(String(error))),
          )
          .finally(finish);
      });
    },

    /** The running stage reported progress. */
    progress: (): void => {
      lastProgress = Date.now();
      if (current !== null) current.progress = new Date().toISOString();
    },

    /** The stage running now, or null between captures. */
    current: (): IHumanViewerCaptureStage | null => current,
  };
}
