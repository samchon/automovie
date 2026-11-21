import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Put an exact sagittal limb solve in the plane of its supported ankle.
 *
 * @param root Fixed actual attachment in model metres.
 * @param ankle The exact model-space ankle target, with lateral displacement from root.
 * @param solve Existing sagittal solver, which owns the chain lengths and fold.
 * @returns Model-space controls from the actual root through the actual ankle.
 * @throws {RangeError} When the displacement does not determine a finite support plane or the planar solver refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives model units, fixed endpoints and the sagittal solve relationship.
 * @evidence contracts/development/implementation.md#principled-implementation Roll the sagittal plane around its longitudinal axis through the attachment. Its vertical coordinate spans the actual ankle's lateral and vertical displacement, so the inverse rotation preserves the solved bar lengths and relative bend.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One projected sagittal request followed by one rigid inverse rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The returned target is the actual ankle. No world target is moved to fit the pose and no bone length is estimated.
 * @evidence contracts/development/implementation.md#efficient-algorithms One existing constant-size triangle solve and one pass over its controls.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing folded sagittal triangle rather than duplicating its length, fold or reach arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh controls without retaining the target, solver or any sample.
 */
export function solveQuadrupedSupportPlane(
  root: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  solve: (planar: IAutoMovieVector3) => IAutoMovieVector3[],
): IAutoMovieVector3[] {
  const side: number = ankle.x - root.x;
  const drop: number = root.y - ankle.y;
  const span: number = Math.hypot(side, drop);
  if (!(Number.isFinite(span) && span > 0))
    throw new RangeError(
      "The lateral ankle does not define a finite support plane",
    );
  const planar: IAutoMovieVector3[] = solve({
    x: root.x,
    y: root.y - span,
    z: ankle.z,
  });
  return planar.map(
    (point: IAutoMovieVector3, index: number): IAutoMovieVector3 => {
      if (index === planar.length - 1) return { ...ankle };
      const fraction: number = (root.y - point.y) / span;
      return {
        x: root.x + fraction * side,
        y: root.y - fraction * drop,
        z: point.z,
      };
    },
  );
}
