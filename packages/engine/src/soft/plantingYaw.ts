import { IAutoMovieQuaternion } from "@automovie/interface";
/** Map a seeded sample to a rational-circle +Y turn, then normalized quaternion interpolation toward identity by the admitted jitter fraction.
 *
 * @evidence contracts/common.md#principled-implementation The two rational first-quadrant arcs and signed second-quadrant lift avoid trigonometric angle sampling; normalization operates on the admitted sample in [0,1) and amount in [0,1]. Distribution is uniform in the half tangent, not in yaw angle.
 * @evidence contracts/common.md#clear-and-simple-design Member yaw and leaf roll share one owner so the same jitter representation and sign choice apply to both consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The w-sign choice follows quaternion hemisphere equivalence, not a consumer fixture; no rejection loop, angle approximation or hidden uniform-angle claim changes the distribution.
 * @evidence contracts/common.md#meaningful-documentation States sample/amount admission, axis, interpolation and nonuniform angular distribution.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar rational arithmetic and one square root take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work One implementation is shared across arrangement and foliage; each distinct seeded input is evaluated without caching a cheap fixed-size quaternion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh quaternion belongs to the caller; no sample stream, placement or leaf record is retained.
 */
export const plantingYaw: (sample: number, amount: number) => IAutoMovieQuaternion = (sample: number, amount: number): IAutoMovieQuaternion => {
  const doubled: number = 2 * sample;
  const half: number = Math.floor(doubled);
  const t: number = doubled - half;
  const denominator: number = 1 + t * t;
  const cosine: number = (1 - t * t) / denominator;
  const sine: number = (2 * t) / denominator;
  // `half === 1` lifts the first quadrant into the second by the quarter-turn
  // rotation `(c, s) -> (-s, c)`, so `φ` sweeps the whole half-turn that a full
  // turn of the branch corresponds to.
  const w: number = half === 0 ? cosine : -sine;
  const y: number = half === 0 ? sine : cosine;
  const blended: { x: number; y: number; z: number; w: number; } = {
    x: 0,
    y: amount * (w < 0 ? -y : y),
    z: 0,
    w: 1 - amount + amount * (w < 0 ? -w : w),
  };
  const length: number = Math.sqrt(blended.y * blended.y + blended.w * blended.w);
  return { x: 0, y: blended.y / length, z: 0, w: blended.w / length };
};
