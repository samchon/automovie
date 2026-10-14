import { ISubdivisionRing } from "./ISubdivisionRing";
import { stepSubdivisionRing } from "./stepSubdivisionRing";

/**
 * Refine a vertex's one-ring until masks that are exact only on its limiting
 * shape see that shape to binary64 precision.
 *
 * `limitSubdivisionRing` calls this for a dart, whose sharp edge takes midpoints
 * although its vertex takes the smooth rule, and for a crease side of three or
 * more faces, whose subdivision matrix has other eigenvectors than the masks
 * of Halstead, Kass and DeRose and of Biermann, Levin and Zorin assume.
 * Refining the ring makes every component other than the limit point and its
 * tangent plane decay geometrically relative to the tangent plane, so after
 * `SETTLE_STEPS` steps the remaining error is below rounding. To keep that
 * precision while the ring shrinks, each step moves the ring's centre to the
 * origin and doubles the ring, which is exact, and the returned `origin` and
 * `scale` map a point of the settled ring back as `origin + point / scale`.
 *
 * @param ring A one-ring whose sharpness is only 0 or 10.
 * @returns The settled ring, and the translation and scale that place it.
 *
 * @evidence contracts/common.md#principled-implementation The limit point and tangent plane of a vertex are those of its refined rings, and the ring step is the exact local subdivision, so repeated refinement converges to them at the rate of the ratio of the third to the second eigenvalue; recentring and doubling, both affine and the doubling exact, keep the shrinking ring at full relative precision. It is not used for a one-face side, whose cross tangent shrinks faster than the ring and would be lost to cancellation.
 * @evidence contracts/common.md#clear-and-simple-design Only the settling lives here; which classes need it is decided with the masks in `limitSubdivisionRing`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The step count is fixed, not a tolerance loop, so every host performs the same arithmetic.
 * @evidence contracts/common.md#meaningful-documentation States which classes are settled and why, the convergence argument, the precision measure, the excluded case, and how to map points back.
 * @evidence contracts/performance.md#efficient-algorithms Constant `SETTLE_STEPS` ring steps, each linear in the valence.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `limitSubdivisionRing` settles each ring at most once and shares the result between its sides.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one ring of the same size and retains nothing.
 */
export const settleSubdivisionRing = (
  ring: ISubdivisionRing,
): { ring: ISubdivisionRing; origin: number[]; scale: number } => {
  const origin: number[] = ring.centre.slice();
  let scale: number = 1;
  let current: ISubdivisionRing = recentre(ring, ring.centre, 1);
  for (let step: number = 0; step < SETTLE_STEPS; ++step) {
    current = stepSubdivisionRing(current);
    for (let axis: number = 0; axis < 3; ++axis)
      origin[axis]! += current.centre[axis]! / scale;
    current = recentre(current, current.centre, 2);
    scale *= 2;
  }
  return { ring: current, origin, scale };
};

/** Ring steps after which a settled ring's masks are exact to binary64 precision. */
const SETTLE_STEPS: number = 64;

/** The ring moved so `centre` is at the origin, then multiplied by `factor`. */
const recentre: (
  ring: ISubdivisionRing,
  centre: readonly number[],
  factor: number,
) => ISubdivisionRing = (
  ring: ISubdivisionRing,
  centre: readonly number[],
  factor: number,
): ISubdivisionRing => {
  const move: (points: readonly number[]) => number[] = (
    points: readonly number[],
  ): number[] =>
    points.map((x: number, i: number): number => (x - centre[i % 3]!) * factor);
  return {
    centre: move(ring.centre),
    edges: move(ring.edges),
    diagonals: move(ring.diagonals),
    sharpness: ring.sharpness,
  };
};
