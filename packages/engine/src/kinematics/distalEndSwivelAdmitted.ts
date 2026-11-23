import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import type { distalTwistSwivelRange } from "./distalTwistSwivelRange";

/**
 * The arc of swivels around a given one over which a chain whose mid segment
 * twists distally (an arm) takes a requested end rotation: outside the arcs its
 * end joint's box refuses (`distalEndSwivelArcs`) and where the twist the
 * rotation leaves the mid segment lies inside its range
 * (`distalTwistSwivelRange`).
 *
 * The admitted swivels are a union of intervals whose ends are the refused
 * arcs' ends and the twist range's breakpoints (Tolani, Goswami and Badler
 * 2000, section 3.2.4: each limit maps to an interval of the swivel), so the
 * interval holding the swivel ends, either way, at the first of those ends past
 * which admission fails, each tested a step of `APART` beyond itself as
 * `distalEndSwivelNearest` tests them. A continued fit follows the interval
 * that overlaps the one its seed was admitted in: the same connected interval,
 * moved by the target.
 *
 * @param arcs The swivels the end joint's box refuses, merged
 *   (`swivelArcs.union`), or every swivel.
 * @param range The twist range's breakpoints and admission; null when that
 *   analysis does not apply, the box alone then deciding.
 * @param swivel The swivel, degrees.
 * @returns The interval, degrees in the swivel's own turn, a full turn centred
 *   on it when nothing bounds it; null when the swivel itself is not admitted.
 */
export function distalEndSwivelAdmitted(
  arcs: readonly IAutoMovieSwivelArcs.IArc[] | "all",
  range: distalTwistSwivelRange.IRange | null,
  swivel: number,
): IAutoMovieSwivelArcs.IArc | null {
  if (arcs === "all") return null;
  const refused = (at: number): boolean => {
    const turned: number = at - 360 * Math.floor(at / 360);
    return arcs.some(
      (arc: IAutoMovieSwivelArcs.IArc): boolean =>
        arc.from < turned && turned < arc.to,
    );
  };
  const admitted = (at: number): boolean =>
    !refused(at) && (range === null || range.admits(at));
  if (!admitted(swivel)) return null;

  // Each end, as an offset from the swivel within half a turn either way.
  const ends: number[] = [];
  for (const arc of arcs) ends.push(arc.from, arc.to);
  if (range !== null) ends.push(...range.breaks);
  let up: number = 180;
  let down: number = 180;
  for (const end of ends) {
    const turn: number = end - swivel;
    const offset: number = turn - 360 * Math.round(turn / 360);
    if (offset > 0 && offset < up && !admitted(swivel + offset + APART))
      up = offset;
    if (offset < 0 && -offset < down && !admitted(swivel + offset - APART))
      down = -offset;
  }
  return { from: swivel - down, to: swivel + up };
}

/**
 * How far past an end a swivel is tested, degrees: `distalEndSwivelNearest`'s
 * step, far above the closed form's rounding and far below the swivel's
 * resolution.
 */
const APART: number = 1e-6;
