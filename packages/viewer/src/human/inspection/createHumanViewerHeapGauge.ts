import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerHeap } from "./IHumanViewerHeap.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * Read the resident page's heap at each work-stage transition and keep the
 * last reading and the peak. A reading still in flight absorbs later
 * transitions instead of queuing behind a renderer that may be busy. A failed
 * reading leaves the last value as it was and is reported as `unavailable`
 * with its cause; the gauge observes and never affects captures.
 */
export function createHumanViewerHeapGauge(
  read: () => Promise<IHumanViewerHeapUsage>,
) {
  const heap: IHumanViewerHeap = {
    last: null,
    peak: null,
    samples: 0,
    unavailable: null,
  };
  let reading = false;
  /** The largest reading since the last `mark`, or null when none arrived. */
  let windowPeak: number | null = null;
  return {
    sample: (work: HumanViewerWork): void => {
      if (reading) return;
      reading = true;
      void read()
        .then((usage) => {
          heap.last = usage;
          heap.unavailable = null;
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
        .catch((error: unknown) => {
          // A failed reading is reported, never turned into a value.
          heap.unavailable =
            error instanceof Error ? error.message : String(error);
        })
        .finally(() => {
          reading = false;
        });
    },
    status: (): IHumanViewerHeap => heap,

    /** Start a new window for `windowPeak`. */
    mark: (): void => {
      windowPeak = null;
    },

    /** The largest reading since the last `mark`, or null when none arrived. */
    windowPeak: (): number | null => windowPeak,
  };
}
