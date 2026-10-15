import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Spine samples of the midpoint rule. */
const STEPS: number = 400;

/** Directions of each section's area. */
const DIRECTIONS: number = 256;

/**
 * Measure the area and first moments of a sweep's sections before its scale
 * profile, at the midpoints of 400 equal steps along the spine.
 *
 * At `u = (i + 0.5) / 400` the area is `(1/2) integral r^2 da` and the first
 * moments `M_x = (1/3) integral r^3 cos a da` and `M_y = (1/3) integral r^3 sin a da`
 * of the radius `r = profile(u, v)`, each by the midpoint rule over 256
 * directions. A scale `s` multiplies the area by `s^2` and the moments by
 * `s^3`, so a sweep whose scale or frames change keeps these numbers;
 * `integrateAutoMovieSweepVolume` combines them with its frames and scale.
 *
 * @param surface A compiled sweep, only read.
 * @returns Area, `M_x` and `M_y` per step, `3 * 400` numbers in square and cubic metres.
 *
 * @evidence contracts/common.md#principled-implementation The section integrals of the swept-volume formula of sweep-based deformation (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section 3.1) with the first-moment terms of an off-centre section, by the midpoint rule.
 * @evidence contracts/common.md#clear-and-simple-design The pose-invariant half of the volume, read from the shape before the scale, so posing never repeats it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The quadrature is fixed, not adapted to a sweep.
 * @evidence contracts/common.md#meaningful-documentation States the integrals, the quadrature, the scale law and the layout.
 * @evidence contracts/performance.md#efficient-algorithms 400 * 256 profile queries, each a cached-row read for a sweep without features, with each direction's cosine and sine computed once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per compiled sweep; the result is the reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; two 256-number direction tables are released on return and the 1,200-number result is transferred to the caller.
 */
export const momentAutoMovieSweepSections: (
  surface: IAutoMovieSweepSurface,
) => Float64Array = (surface: IAutoMovieSweepSurface): Float64Array => {
  const out: Float64Array = new Float64Array(3 * STEPS);
  const cos: Float64Array = Float64Array.from(
    { length: DIRECTIONS },
    (_: unknown, d: number): number =>
      Math.cos((2 * Math.PI * (d + 0.5)) / DIRECTIONS),
  );
  const sin: Float64Array = Float64Array.from(
    { length: DIRECTIONS },
    (_: unknown, d: number): number =>
      Math.sin((2 * Math.PI * (d + 0.5)) / DIRECTIONS),
  );
  for (let i: number = 0; i < STEPS; ++i) {
    const u: number = (i + 0.5) / STEPS;
    let area: number = 0;
    let mx: number = 0;
    let my: number = 0;
    for (let d: number = 0; d < DIRECTIONS; ++d) {
      const r: number = surface.profile(u, (d + 0.5) / DIRECTIONS);
      area += r * r;
      mx += r * r * r * cos[d]!;
      my += r * r * r * sin[d]!;
    }
    out[3 * i] = (area * Math.PI) / DIRECTIONS;
    out[3 * i + 1] = (mx * 2 * Math.PI) / (3 * DIRECTIONS);
    out[3 * i + 2] = (my * 2 * Math.PI) / (3 * DIRECTIONS);
  }
  return out;
};
