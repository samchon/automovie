import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

import type { staggerRecover } from "./staggerRecover";

/*
 * The feet's contact windows of a stagger: each foot is planted on the ground
 * from the action's start, or from its last landing, until its next recovery
 * step starts, and from its last landing to the end.
 * Parameter recovery: The recovery, whose steps name each swing's foot, start and
 * landing in seconds since the push.
 * Parameter duration: The action's duration, seconds.
 * Returns: The plant windows, as shares of the duration, the left foot's first.
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
