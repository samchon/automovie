/**
 * Accumulate supplied stage durations for one capture. Durations come from the injected monotonic clock or externally measured additions and are summed by name when a stage repeats. Nested or concurrent intervals can overlap, and work outside recorded intervals is not attributed, so the total is not necessarily a partition of the page's `show` time. `reset` starts a new capture. The record holds names and milliseconds only. Names are arbitrary keys, including JavaScript prototype names; reset replaces the record. Its entry count is not capped independently of supplied stages.
 *
 * @evidence contracts/common.md#principled-implementation Monotonic start/end readings accumulate repeated stage durations, including rejected tasks through finally, while reset defines a fresh capture record.
 * @evidence contracts/common.md#clear-and-simple-design One null-prototype duration record supports measured stages, externally measured additions and copied snapshots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype-like stage names remain ordinary duration keys and rejected work is still timed instead of disappearing from attribution.
 * @evidence contracts/common.md#meaningful-documentation Documentation states clock authority, repeated-stage summation, reset scope and the lack of an independent stage-count cap.
 * @evidence contracts/performance.md#efficient-algorithms Stage updates use constant-time property operations; snapshots copy all recorded stage names once.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated names accumulate distinct measured executions rather than reusing prior elapsed times as a new measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Names and numbers remain until reset replaces the record; arbitrary supplied names have no independent cap, and asynchronous tasks keep their closures until settlement.
 */
export function createHumanViewerSpans(now: () => number): {
  reset: () => void;
  measure: <T>(name: string, task: () => Promise<T>) => Promise<T>;
  add: (name: string, ms: number) => void;
  snapshot: () => Record<string, number>;
} {
  let totals: Record<string, number> = Object.create(null) as Record<string, number>;
  return {
    /** Start a new capture with no recorded stage. */
    reset: (): void => {
      totals = Object.create(null) as Record<string, number>;
    },

    /** Run `task`, adding its duration to the stage `name`, whether it resolves or rejects. */
    measure: async <T>(name: string, task: () => Promise<T>): Promise<T> => {
      const started: number = now();
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
