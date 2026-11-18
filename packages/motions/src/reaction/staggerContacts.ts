import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

import type { staggerRecover } from "./staggerRecover";

/**
 * The feet's contact windows of a stagger: each foot is planted on the
 * ground from the action's start, or from its last landing, until its next
 * recovery step starts, and from its last landing to the end.
 *
 * @param recovery The recovery, whose steps name each swing's foot, start and landing in seconds since the push.
 * @param duration The action's duration, seconds.
 * @returns The plant windows, as shares of the duration, the left foot's first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, each input's unit and the windows' unit and order.
 * @evidence contracts/development/implementation.md#principled-implementation A foot bears between its swings: one scan of the declared steps per foot closes a window at each step's start and opens the next at its landing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop per side over the steps.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A step that starts at the instant its foot landed opens no empty window; the last window's start is held inside the action.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(s) for s recovery steps, twice.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function staggerContacts(
  recovery: staggerRecover.IRecovery,
  duration: number,
): IAutoMovieMotionHumanContactWindow[] {
  const out: IAutoMovieMotionHumanContactWindow[] = [];
  for (const side of ["left", "right"] as const) {
    let from: number = 0;
    for (const step of recovery.steps) {
      if (step.side !== side) continue;
      if (step.start > from)
        out.push({
          part: `${side}Foot`,
          kind: "plant",
          from: from / duration,
          to: step.start / duration,
          support: { kind: "ground" },
        });
      from = step.land;
    }
    out.push({
      part: `${side}Foot`,
      kind: "plant",
      from: Math.min(1, from / duration),
      to: 1,
      support: { kind: "ground" },
    });
  }
  return out;
}
