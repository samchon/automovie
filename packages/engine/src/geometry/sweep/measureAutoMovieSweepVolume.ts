import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Spine samples of the midpoint rule. */
const STEPS: number = 400;

/** Directions of each section's area. */
const DIRECTIONS: number = 256;

/**
 * Measure the volume a sweep encloses between its end sections.
 *
 * A planar section of area `A(u)` moving with spine point `C(u)` and plane
 * normal `N(u)` sweeps `dV = A(u) <N(u), C'(u)> du` when the section is
 * centred on the spine (Hyun et al. 2005, The Visual Computer 21(8-10):542-550,
 * Section 3.1). A section of this engine may lie off-centre, so the flux of
 * every section point's velocity through the plane is integrated instead:
 * with plane axes `X`, `Y`, a point `C + x X + y Y` moves along `N` at
 * `<C', N> + x <X', N> + y <Y', N>`, which integrates over the section to
 * `A <C', N> + M_x <X', N> + M_y <Y', N>` with the first moments
 * `M_x = (1/3) integral r^3 cos a da` and `M_y = (1/3) integral r^3 sin a da`,
 * and reduces to the published formula when both moments vanish. The area
 * is `(1/2) integral r^2 da`. The integrals use the midpoint rule, 400 steps
 * along the spine and 256 directions round it, with every derivative a
 * difference over its step.
 *
 * The formula counts a region twice where neighbouring sections cross, as on
 * the inside of a tight bend, so it measures the sweep's own volume only while
 * the surface has no self-intersection.
 *
 * @param surface A compiled sweep, only read.
 * @returns Cubic metres.
 *
 * @evidence contracts/common.md#principled-implementation The normal flux of a moving planar section, which is the swept-volume formula of sweep-based deformation plus the first-moment terms an off-centre section adds, integrated by the midpoint rule; its premise, a sweep without self-intersection, is stated.
 * @evidence contracts/common.md#clear-and-simple-design Reads the compiled surface's frames and radii, so the same definition is both rendered and measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No correction is applied for crossing sections; the premise is documented instead.
 * @evidence contracts/common.md#meaningful-documentation States the formula and its sources, the quadrature, the unit and the self-intersection premise.
 * @evidence contracts/performance.md#efficient-algorithms O(400 * 256) radius queries, each a cached-row read for a surface without features.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement; the surface's row cache is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const measureAutoMovieSweepVolume: (surface: IAutoMovieSweepSurface) => number = (
  surface: IAutoMovieSweepSurface,
): number => {
  let volume: number = 0;
  for (let i: number = 0; i < STEPS; ++i) {
    const u: number = (i + 0.5) / STEPS;
    let area: number = 0;
    let mx: number = 0;
    let my: number = 0;
    for (let d: number = 0; d < DIRECTIONS; ++d) {
      const a: number = (2 * Math.PI * (d + 0.5)) / DIRECTIONS;
      const r: number = surface.radius(u, (d + 0.5) / DIRECTIONS);
      area += r * r;
      mx += r * r * r * Math.cos(a);
      my += r * r * r * Math.sin(a);
    }
    area *= Math.PI / DIRECTIONS;
    mx *= (2 * Math.PI) / (3 * DIRECTIONS);
    my *= (2 * Math.PI) / (3 * DIRECTIONS);
    const f: IAutoMovieSweepFrame = surface.frame(u);
    const a: IAutoMovieSweepFrame = surface.frame(i / STEPS);
    const b: IAutoMovieSweepFrame = surface.frame((i + 1) / STEPS);
    const step: IAutoMovieVector3 = Vector3.subtract(b.origin, a.origin);
    volume +=
      area * Vector3.dot(f.normal, step) +
      mx * Vector3.dot(f.normal, Vector3.subtract(b.x, a.x)) +
      my * Vector3.dot(f.normal, Vector3.subtract(b.y, a.y));
  }
  return volume;
};
