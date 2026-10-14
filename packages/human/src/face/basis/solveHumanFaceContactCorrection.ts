import type { IHumanFaceContactFloor } from "./IHumanFaceContactFloor";
import { isHumanFaceContactFloorSatisfied } from "./isHumanFaceContactFloorSatisfied";
import { solveHumanFaceContactProjection } from "./solveHumanFaceContactProjection";

/**
 * A bounded local clearance witness. A largest single-floor projection along
 * the gradient reads clearance growing at unit rate, because the nearest
 * feature stays nearest along its own radial ray, so when it satisfies all full
 * floors it attains the norm lower bound and needs no native solve. The
 * projection n * m reads n . (n * m) = m only in real arithmetic, so a floating
 * reading may miss by a rounding unit; that case takes the solve, which reaches
 * the same floor. Otherwise the shared QP
 * minimizes squared displacement in budget units to the floors themselves; only
 * when the budget cannot reach them does it relax each by half the contact
 * tolerance. The tolerance is the admission slack, so it is not spent while the
 * floors are reachable, and the other half stays for the solver's residual
 * (about 1e-6 of the budget) so the candidate does not land on the admission
 * edge, where one nanometre decides between accepting and refusing. The gradient linearisation is conservative where clearance is
 * convex, outside a convex feature, and actual signed geometry is checked by
 * the caller before committing any move.
 *
 * @evidence contracts/common.md#principled-implementation A largest violated unit-gradient row gives a direct norm lower-bound candidate; it is used only when every full affine floor and movement budget holds. Otherwise a shared three-variable QP tries full floors, then existing half-tolerance relaxation. The actual caller verifies signed geometry before commit.
 * @evidence contracts/common.md#clear-and-simple-design This helper selects direct versus projected correction while the projection owns native row scaling and the contact orchestrator owns nonlinear floors/staging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller premises include at least one violated row and a positive admitted budget; empty/no-violation rows are not a supported correction request. Half-tolerance is existing admission slack, not a new physical clearance, and failed projection refuses without fabricated motion.
 * @evidence contracts/common.md#meaningful-documentation Prose gives unit-gradient lower-bound reasoning, floating direct fallback, original/relaxed floors and nonlinear verification limits; returned displacement is fresh and source rows unchanged.
 * @evidence contracts/performance.md#efficient-algorithms R floors are scanned for the maximum and direct feasibility; at most two three-variable QPs dominate by floor population/native iterations. The fast path avoids a solve only after complete row verification.
 * @evidence contracts/performance.md#reuse-equivalent-work The original rows serve direct and both solve attempts; no geometry query is repeated here and changed floors/budget require a new request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Violation subsets/lowers/native candidates are local and only three displacement values transfer; refusal retains no history or external native handle.
 */
export function solveHumanFaceContactCorrection(
  rows: readonly IHumanFaceContactFloor[],
  budget: number,
  tolerance: number,
): number[] {
  const needed: IHumanFaceContactFloor[] = rows.filter((row: IHumanFaceContactFloor): boolean  => row.minimum > tolerance);
  const largest: IHumanFaceContactFloor = needed.reduce((a: IHumanFaceContactFloor, b: IHumanFaceContactFloor): IHumanFaceContactFloor  => (a.minimum >= b.minimum ? a : b));
  const direct: number[] = largest.normal.map((value: number): number  => value * largest.minimum);
  if (Math.hypot(...direct) <= budget && isHumanFaceContactFloorSatisfied(rows, direct, 0)) return direct;
  // A required positive displacement with zero budget already refused above.
  const vector: number[] | null =
    solveHumanFaceContactProjection(
      rows,
      [0, 0, 0],
      budget,
      tolerance,
      rows.map((row: IHumanFaceContactFloor): number  => row.minimum),
    ) ??
    solveHumanFaceContactProjection(
      rows,
      [0, 0, 0],
      budget,
      tolerance,
      rows.map((row: IHumanFaceContactFloor): number  => row.minimum - tolerance / 2),
    );
  if (vector === null)
    throw new Error(
      "The simultaneous contact solve returned no verified displacement.",
    );
  return vector;
}
