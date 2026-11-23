import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import type { distalTwistSwivelRange } from "./distalTwistSwivelRange";
import { swivelArcs } from "./swivelArcs";

/**
 * The swivel nearest a desired one at which a chain whose mid segment twists
 * distally (an arm) can take a requested end rotation: outside the arcs its end
 * joint's box refuses (`distalEndSwivelArcs`) and where the twist the rotation
 * leaves the mid segment lies inside its range (`distalTwistSwivelRange`).
 *
 * The admissible swivels are a union of intervals whose ends are the refused
 * arcs' ends and the twist range's breakpoints, so the admissible swivel
 * nearest the desired one is the desired one itself or one of those ends: each
 * is tested, a breakpoint a step of `APART` either side of itself since the
 * admission changes there, and the nearest admitted is returned (the admissible
 * swivel nearest the desired one, Tolani, Goswami and Badler 2000, section
 * 3.2.4). When none is admitted (no swivel lets the joints take the rotation
 * exactly, or the twist analysis is not given) the result is the swivel outside
 * the refused arcs nearest the desired one, the candidate the box alone gives.
 * The caller verifies the returned swivel by its own score.
 *
 * @param arcs The swivels the end joint's box refuses, merged
 *   (`swivelArcs.union`), or every swivel.
 * @param range The twist range's breakpoints and admission; null when that
 *   analysis does not apply.
 * @param desired The desired swivel, degrees.
 * @returns The swivel, degrees in any turn; null when the box refuses every
 *   swivel.
 */
export function distalEndSwivelNearest(
  arcs: readonly IAutoMovieSwivelArcs.IArc[] | "all",
  range: distalTwistSwivelRange.IRange | null,
  desired: number,
): number | null {
  const plain: number | null = swivelArcs.nearest(arcs, desired);
  if (plain === null || arcs === "all" || range === null) return plain;

  // Strictly inside a refused arc; an arc's own end is the box's bound, kept
  // inside the box by the caller's margin.
  const refused = (swivel: number): boolean => {
    const at: number = swivel - 360 * Math.floor(swivel / 360);
    return arcs.some(
      (arc: IAutoMovieSwivelArcs.IArc): boolean => arc.from < at && at < arc.to,
    );
  };
  const admitted = (swivel: number): boolean =>
    !refused(swivel) && range.admits(swivel);
  if (admitted(desired)) return desired;
  const apart = (swivel: number): number => {
    const turn: number = swivel - desired;
    return Math.abs(turn - 360 * Math.round(turn / 360));
  };
  const candidates: number[] = [];
  for (const arc of arcs) candidates.push(arc.from, arc.to);
  for (const at of range.breaks) candidates.push(at - APART, at + APART);
  let nearest: number | null = null;
  for (const swivel of candidates) {
    if (nearest !== null && !(apart(swivel) < apart(nearest))) continue;
    if (admitted(swivel)) nearest = swivel;
  }
  return nearest ?? plain;
}

/**
 * How far either side of a twist breakpoint a candidate stands, degrees: far
 * above the rounding of the closed form at a swivel, far below the swivel's
 * resolution (`hingedArmSwivel.RESOLUTION`), so the side of the breakpoint is
 * decided and the place is the breakpoint's.
 */
const APART: number = 1e-6;
