import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { distalEndSwivelNearest } from "./distalEndSwivelNearest";
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
 * A swivel known only to a resolution (a fit's answer, refined to
 * `hingedArmSwivel.RESOLUTION`) lies in the interval of the admitted swivel
 * nearest it (`distalEndSwivelNearest`) where that one is within the
 * resolution, the interval then widened to hold it: the fit cannot tell the two
 * apart, so an answer on an interval's end, a rounding or a refinement step
 * outside it, keeps the interval it was found in.
 *
 * @param arcs The swivels the end joint's box refuses, merged
 *   (`swivelArcs.union`), or every swivel.
 * @param range The twist range's breakpoints and admission; null when that
 *   analysis does not apply, the box alone then deciding.
 * @param swivel The swivel, degrees.
 * @param resolution How far the swivel is known to, degrees; 0 when absent.
 * @returns The interval, degrees in the swivel's own turn, a full turn centred
 *   on it when nothing bounds it; null when no swivel within the resolution is
 *   admitted.
 */
export function distalEndSwivelAdmitted(
  arcs: readonly IAutoMovieSwivelArcs.IArc[] | "all",
  range: distalTwistSwivelRange.IRange | null,
  swivel: number,
  resolution: number = 0,
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

  // The admitted swivel the interval is read around: the swivel itself, or
  // the admitted one nearest it within the resolution.
  let around: number = swivel;
  if (!admitted(swivel)) {
    const nearest: number | null = distalEndSwivelNearest(arcs, range, swivel);
    if (nearest === null || !admitted(nearest)) return null;
    const turn: number = nearest - swivel;
    const offset: number = turn - 360 * Math.round(turn / 360);
    if (!(Math.abs(offset) <= resolution)) return null;
    around = swivel + offset;
  }

  // Each end, as an offset from that swivel within half a turn either way.
  const ends: number[] = [];
  for (const arc of arcs) ends.push(arc.from, arc.to);
  if (range !== null) ends.push(...range.breaks);
  let up: number = 180;
  let down: number = 180;
  for (const end of ends) {
    const turn: number = end - around;
    const offset: number = turn - 360 * Math.round(turn / 360);
    if (offset > 0 && offset < up && !admitted(around + offset + APART))
      up = offset;
    if (offset < 0 && -offset < down && !admitted(around + offset - APART))
      down = -offset;
  }
  return {
    from: Math.min(swivel, around - down),
    to: Math.max(swivel, around + up),
  };
}

/**
 * How far past an end a swivel is tested, degrees: `distalEndSwivelNearest`'s
 * step, far above the closed form's rounding and far below the swivel's
 * resolution.
 */
const APART: number = 1e-6;
