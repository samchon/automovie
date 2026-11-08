import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * The schedule at one instant, pure and seekable: the entries active then
 * with their phase, and each subject's latest state snapshot from an entry
 * already ended. Reading any instant in any order gives the same answer.
 *
 * @param schedule The resolved schedule.
 * @param seconds Film seconds.
 * @returns The active entries and the subjects' states.
 */
export function evaluateAutoMovieSchedule(
  schedule: IAutoMovieSchedule,
  seconds: number,
): evaluateAutoMovieSchedule.IInstant {
  const active: evaluateAutoMovieSchedule.IActive[] = [];
  const states: Record<string, unknown> = {};
  const ended: Map<string, IAutoMovieSchedule.IEntry> = new Map();
  for (const entry of schedule.entries) {
    if (entry.start <= seconds && seconds < entry.end)
      active.push({
        entry,
        local: seconds - entry.start,
        phase: (seconds - entry.start) / (entry.end - entry.start),
      });
    if (entry.end <= seconds && entry.state !== undefined) {
      const previous: IAutoMovieSchedule.IEntry | undefined = ended.get(
        entry.subject,
      );
      if (
        previous === undefined ||
        entry.end > previous.end ||
        (entry.end === previous.end && entry.index > previous.index)
      )
        ended.set(entry.subject, entry);
    }
  }
  for (const [subject, entry] of ended) states[subject] = entry.state;
  return { seconds, active, states };
}
/** Companion types of {@link evaluateAutoMovieSchedule}. */
export namespace evaluateAutoMovieSchedule {
  /** One active entry. */
  export interface IActive {
    /** The entry. */
    entry: IAutoMovieSchedule.IEntry;

    /** Seconds since its start. */
    local: number;

    /** Share of its duration elapsed, in [0, 1). */
    phase: number;
  }

  /** The schedule at an instant. */
  export interface IInstant {
    /** The instant. */
    seconds: number;

    /** Active entries, by start. */
    active: IActive[];

    /** Each subject's state after its latest ended entry with a state. */
    states: Record<string, unknown>;
  }
}
