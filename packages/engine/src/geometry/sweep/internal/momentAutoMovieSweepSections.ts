import type { IAutoMovieSweepSurface } from "@automovie/interface";

/*
 * Spine samples of the midpoint rule.
 */
const STEPS: number = 400;

/*
 * Directions of each section's area.
 */
const DIRECTIONS: number = 256;

/*
 * Measure the area and first moments of a sweep's sections before its scale
 * profile, at the midpoints of 400 equal steps along the spine.
 *
 * At `u = (i + 0.5) / 400` the area is `(1/2) integral r^2 da` and the first
 * moments `M_x = (1/3) integral r^3 cos a da` and `M_y = (1/3) integral r^3 sin
 * a da` of the radius `r = profile(u, v)`, each by the midpoint rule over 256
 * directions. A scale `s` multiplies the area by `s^2` and the moments by
 * `s^3`, so a sweep whose scale or frames change keeps these numbers;
 * `integrateAutoMovieSweepVolume` combines them with its frames and scale.
 * Parameter surface: A compiled sweep, only read.
 * Returns: Area, `M_x` and `M_y` per step, `3 * 400` numbers in square and
 * cubic metres.
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
