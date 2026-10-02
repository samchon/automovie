/**
 * Accumulate the wall time a page spends in named stages of one capture, so
 * every millisecond of a cold build is attributed to a stage instead of
 * disappearing into the page's single `show` total. Durations come from the
 * injected monotonic clock and are summed by name when a stage repeats.
 * `reset` starts a new capture. The record holds names and milliseconds only.
 *
 * @evidence contracts/common.md#principled-implementation Differences of one monotonic clock around each awaited stage, summed by name, with the interval closed in a finally so a refused stage is still counted.
 * @evidence contracts/common.md#clear-and-simple-design One accumulator serves every stage and owns the only mutable totals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records measured durations and never estimates or special-cases a document.
 * @evidence contracts/common.md#meaningful-documentation States the clock, the summing rule and the capture boundary.
 */
export function createHumanViewerSpans(now: () => number) {
  let totals: Record<string, number> = {};
  return {
    /** Start a new capture with no recorded stage. */
    reset: (): void => {
      totals = {};
    },

    /** Run `task`, adding its duration to the stage `name`, whether it resolves or rejects. */
    measure: async <T>(name: string, task: () => Promise<T>): Promise<T> => {
      const started = now();
      try {
        return await task();
      } finally {
        totals[name] = (totals[name] ?? 0) + now() - started;
      }
    },

    /** The milliseconds recorded per stage since the last reset. */
    snapshot: (): Record<string, number> => ({ ...totals }),
  };
}
