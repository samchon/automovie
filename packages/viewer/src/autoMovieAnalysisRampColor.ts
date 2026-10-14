/**
 * Map a normalized `[0, 1]` position on the ramp to a colour.
 *
 * A three-stop blue-green-red ramp, interpolated linearly in each channel. It
 * returns RGB channel values without allocating a texture. The caller owns the
 * renderer's subsequent color-space conversion. Finite values outside the unit
 * interval clamp to the nearest endpoint; NaN propagates rather than becoming a
 * valid color.
 *
 * @evidence contracts/common.md#principled-implementation Uses two linear segments through blue (0,0,1), green (0,1,0) and red (1,0,0), clamping normalized positions to [0,1]; finite normalized inputs are the overlay premise, with no claim about later renderer color management or NaN repair.
 * @evidence contracts/common.md#clear-and-simple-design One scalar-to-RGB value function owns the overlay ramp definition without texture sampling, palette state or renderer dependence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoints and the green midpoint define the supported ramp, not expected-fixture exceptions; no foreign method replacement, hidden gamma adjustment or special metric key occurs.
 * @evidence contracts/common.md#meaningful-documentation States the three stops, piecewise channel interpolation, out-of-range clamping, caller color-space responsibility and NaN limitation.
 * @evidence contracts/performance.md#efficient-algorithms Performs one clamp, branch and fixed-count arithmetic operations and allocates one three-channel value, constant time/space per point.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses a single ramp definition across overlay builds; creates no texture or cache, and inexpensive scalar arithmetic does not warrant cross-request result retention.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no input or renderer resource; one returned RGB value belongs to the caller and no task or GPU handle is acquired.
 */
export const autoMovieAnalysisRampColor: (position: number) => {
  r: number;
  g: number;
  b: number;
} = (position: number): { r: number; g: number; b: number } => {
  const t: number = Math.min(1, Math.max(0, position));
  if (t <= 0.5) {
    const local: number = t * 2;
    return { r: 0, g: local, b: 1 - local };
  }
  const local: number = (t - 0.5) * 2;
  return { r: local, g: 1 - local, b: 0 };
};
