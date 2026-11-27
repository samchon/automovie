import {
  type IAutoMovieSweepFrame,
  type IAutoMovieSweepSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { integrateSweepVolume } from "./integrateSweepVolume";
import { momentSweepSections } from "./momentSweepSections";

/*
 * Measure the volume a sweep encloses between its end sections.
 *
 * A planar section of area `A(u)` moving with spine point `C(u)` and plane
 * normal `N(u)` sweeps `dV = A(u) <N(u), C'(u)> du` when the section is centred
 * on the spine (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section
 * 3.1). A section of this engine may lie off-centre, so the flux of every
 * section point's velocity through the plane is integrated instead: with plane
 * axes `X`, `Y`, a point `C + x X + y Y` moves along `N` at `<C', N> + x <X',
 * N> + y <Y', N>`, which integrates over the section to `A <C', N> + M_x <X',
 * N> + M_y <Y', N>` with the first moments `M_x = (1/3) integral r^3 cos a da`
 * and `M_y = (1/3) integral r^3 sin a da`, and reduces to the published formula
 * when both moments vanish. The area is `(1/2) integral r^2 da`. The integrals
 * use the midpoint rule, 400 steps along the spine and 256 directions round it,
 * with every derivative a difference over its step:
 * `momentSweepSections` integrates the sections before the scale
 * profile and `integrateSweepVolume` sums the flux with the scale and
 * frames, the same two steps a posed sweep's volume preservation runs.
 *
 * The formula counts a region twice where neighbouring sections cross, as on
 * the inside of a tight bend, so it measures the sweep's own volume only while
 * the surface has no self-intersection.
 * Parameter surface: A compiled sweep, only read.
 * Returns: Cubic metres.
 */
export const measureSweepVolume: (
  surface: IAutoMovieSweepSurface,
) => number = (surface: IAutoMovieSweepSurface): number => {
  const moments: Float64Array = momentSweepSections(surface);
  const steps: number = moments.length / 3;
  const scales: Float64Array = Float64Array.from(
    { length: steps },
    (_: unknown, i: number): number => surface.scale((i + 0.5) / steps),
  );
  const frames: Float64Array = new Float64Array(12 * (2 * steps + 1));
  for (let j: number = 0; j <= 2 * steps; ++j) {
    const f: IAutoMovieSweepFrame = surface.frame(j / (2 * steps));
    frames.set(
      [f.origin, f.x, f.y, f.normal].flatMap(
        (v: IAutoMovieVector3): number[] => [v.x, v.y, v.z],
      ),
      12 * j,
    );
  }
  return integrateSweepVolume(moments, scales, frames);
};
