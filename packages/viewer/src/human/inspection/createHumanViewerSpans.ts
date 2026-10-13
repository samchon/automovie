/**
 * Accumulate the wall time a page spends in named stages of one capture, so
 * every millisecond of a cold build is attributed to a stage instead of
 * disappearing into the page's single `show` total. Durations come from the
 * injected monotonic clock and are summed by name when a stage repeats.
 * `reset` starts a new capture. The record holds names and milliseconds only.
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

    /** Add a duration measured elsewhere to the stage `name`. */
    add: (name: string, ms: number): void => {
      totals[name] = (totals[name] ?? 0) + ms;
    },

    /** The milliseconds recorded per stage since the last reset. */
    snapshot: (): Record<string, number> => ({ ...totals }),
  };
}
