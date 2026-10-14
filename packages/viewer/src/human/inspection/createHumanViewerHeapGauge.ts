import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerHeap } from "./IHumanViewerHeap.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import { describeHumanViewerError } from "./describeHumanViewerError.js";

/**
 * Read the resident page's heap at each work-stage transition and keep the last reading and the peak. A reading still in flight absorbs later transitions instead of queuing behind a renderer that may be busy. A failed reading leaves the last value as it was and is reported as `unavailable` with its cause; the gauge observes and never affects captures. Peak provenance names the progress event that triggered sampling, not an exact contemporaneous stage measurement. A reading started before `mark` cannot contribute to the subsequent window's peak.
 *
 * @evidence contracts/common.md#principled-implementation At most one asynchronous heap sample runs; observed usage updates last/global peak while a mark epoch prevents an earlier sample from contaminating a later capture-room window.
 * @evidence contracts/common.md#clear-and-simple-design Global heap status and window-scoped peak share one reader, while trigger progress supplies descriptive context rather than an invented exact measurement stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Synchronous reader throws and rejected reads become unavailable causes without replacing the last actual value or fabricating zero usage.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains single-flight sampling, last/peak retention, failures, triggering-event provenance and exclusion of pre-mark samples from new windows.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sample gating and peak comparisons use fixed bookkeeping; the actual CDP/V8 measurement cost remains with the supplied reader.
 * @evidence contracts/performance.md#reuse-equivalent-work Transitions while a read is running do not start duplicate observations; results remain that sample's facts and only matching window epochs contribute to windowPeak.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The gauge retains one pending read, one last usage and one global peak plus scalar window state; a reader that never settles leaves sampling busy without spawning additional tasks.
 */
export function createHumanViewerHeapGauge(
  read: () => Promise<IHumanViewerHeapUsage>,
): {
  sample: (work: HumanViewerWork) => void;
  status: () => IHumanViewerHeap;
  mark: () => void;
  windowPeak: () => number | null;
} {
  const heap: IHumanViewerHeap = {
    last: null,
    peak: null,
    samples: 0,
    unavailable: null,
  };
  let reading: boolean = false;
  let epoch: number = 0;
  /** The largest reading since the last `mark`, or null when none arrived. */
  let windowPeak: number | null = null;
  return {
    sample: (work: HumanViewerWork): void => {
      if (reading) return;
      reading = true;
      const selectedEpoch: number = epoch;
      void Promise.resolve().then(read)
        .then((usage: IHumanViewerHeapUsage): void => {
          heap.last = usage;
          heap.unavailable = null;
          if (selectedEpoch === epoch)
            windowPeak = Math.max(windowPeak ?? 0, usage.usedSize);
          ++heap.samples;
          if (heap.peak === null || usage.usedSize > heap.peak.usedSize)
            heap.peak = {
              usedSize: usage.usedSize,
              revision: work.revision,
              doc: work.doc,
              phase: work.phase,
              at: new Date().toISOString(),
            };
        })
        .catch((error: unknown): void => {
          // A failed reading is reported, never turned into a value.
          heap.unavailable = describeHumanViewerError(error);
        })
        .finally((): void => {
          reading = false;
        });
    },
    status: (): IHumanViewerHeap => heap,

    /** Start a new window for `windowPeak`. */
    mark: (): void => {
      ++epoch;
      windowPeak = null;
    },

    /** The largest reading since the last `mark`, or null when none arrived. */
    windowPeak: (): number | null => windowPeak,
  };
}
