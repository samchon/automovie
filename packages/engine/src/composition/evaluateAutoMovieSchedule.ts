import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * The schedule at one instant, pure and seekable: the entries active then
 * with their phase, and each subject's latest state snapshot from an entry
 * already ended. Reading any instant in any order gives the same answer.
 *
 * @param schedule The resolved schedule.
 * @param seconds Film seconds.
 * @returns The active entries and the subjects' states.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The schedule at one instant, pure and seekable: the entries active then with their phase, and each subject's latest state snapshot from an entry already ended) and documents parameters `schedule`, `seconds`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The schedule at one instant, pure and seekable: the entries active then with their phase, and each subject's latest state snapshot from an entry already ended) directly over its typed inputs (`schedule`, `seconds`) as 2 sequential passes (for-of over schedule.entries; for-of over ended), delegating to `active.push`, `ended.get`, `ended.set`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 26 lines and 6 top-level statements that reuses `active.push`, `ended.get`, `ended.set` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `schedule`, `seconds`; the dominant cost is 2 sequential passes (for-of over schedule.entries; for-of over ended), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
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
/**
 * Companion types of {@link evaluateAutoMovieSchedule}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 2 members (`IActive`, `IInstant`); units and frames named in its text: seconds, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `evaluateAutoMovieSchedule` in packages/engine/src/composition/evaluateAutoMovieSchedule.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
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
