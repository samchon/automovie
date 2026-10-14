import {
  IAutoMoviePruningEnvelope,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Test a recipe-local point against the authored none, closed box or closed sphere pruning envelope.
 *
 * @evidence contracts/common.md#principled-implementation Box membership uses inclusive component comparisons; sphere membership uses direct squared offset and radius. Typed admitted envelopes/points are premises, while extreme square overflow/underflow can make the sphere comparison unreliable.
 * @evidence contracts/common.md#clear-and-simple-design Growth's emission admission and analytic pruning operate on the same authored envelope, with membership kept separate from exit distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No invented clipping region or point clamp replaces the envelope; none means unrestricted growth and a boundary point is intentionally inside.
 * @evidence contracts/common.md#meaningful-documentation States recipe-local frame, closed-boundary meaning and squared-arithmetic limitations.
 * @evidence contracts/performance.md#efficient-algorithms Three-axis comparisons or a fixed squared norm take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work One predicate serves every emitted branch base; varying points cannot reuse a prior membership result behind envelope identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean transfers; point and envelope are read without mutation or retained references.
 */
export const plantingContainsPoint: (
  envelope: IAutoMoviePruningEnvelope,
  point: IAutoMovieVector3,
) => boolean = (
  envelope: IAutoMoviePruningEnvelope,
  point: IAutoMovieVector3,
): boolean => {
  if (envelope.kind === "none") return true;
  if (envelope.kind === "box")
    return (
      point.x >= envelope.min.x &&
      point.x <= envelope.max.x &&
      point.y >= envelope.min.y &&
      point.y <= envelope.max.y &&
      point.z >= envelope.min.z &&
      point.z <= envelope.max.z
    );
  const dx: number = point.x - envelope.center.x;
  const dy: number = point.y - envelope.center.y;
  const dz: number = point.z - envelope.center.z;
  return dx * dx + dy * dy + dz * dz <= envelope.radius * envelope.radius;
};
