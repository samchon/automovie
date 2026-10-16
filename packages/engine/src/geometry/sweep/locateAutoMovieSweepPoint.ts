import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Even samples of the spine parameter a sign change of the plane distance is bracketed between. */
const SAMPLES: number = 128;
/** Bisection steps that place the plane on the point; each halves the bracket. */
const BISECTIONS: number = 48;
/**
 * Find where a point lies on a compiled sweep: the spine parameter whose section plane holds it, its polar direction in that plane, and how far it stands outside the surface along that direction.
 *
 * The point's signed distance from the section plane at `u` is sampled at 128 even parameters; each sign change is bracketed and bisected 48 times, and among the planes found the one where the point lies nearest the surface is taken, since a bent spine can carry several planes through one point. A point no plane holds, beyond either end of the spine, takes the end whose plane lies nearer. The direction is the polar angle of the point about the spine point from the plane's first axis toward its second, as a turn from 0 to 1, the `v` every other sweep query takes; the offset is the point's distance from the spine point in the plane less the surface's radius in that direction, positive outside.
 *
 * @param props.surface The compiled sweep, only read.
 * @param props.point The point, metres.
 * @returns `u`, the spine parameter of the section plane holding the point, 0 to 1; `v`, the point's polar direction in that plane, a turn from 0 to 1; and `offset`, its distance outside the surface along that direction in metres, negative inside.
 * @throws Error when the point is not finite.
 *
 * @evidence contracts/common.md#principled-implementation Inverting a sweep's section-plane family by bracketing and bisecting the point's signed plane distance along the spine, the standard root finding for a monotone or piecewise monotone scalar, and reading the direction as the polar angle in the plane the forward map uses.
 * @evidence contracts/common.md#clear-and-simple-design Uses only the surface's own frame and radius queries, so it inverts exactly what the sweep evaluates, fixed or transported orientation and station turns included.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Several candidate planes are resolved by a stated rule, the nearest surface, and a point beyond the spine by the nearer end's plane; non-finite input is refused.
 * @evidence contracts/common.md#meaningful-documentation States the sampling, the bracketing and bisection, the choice among planes, the end rule, the direction convention and the offset's sign.
 * @evidence contracts/performance.md#efficient-algorithms 128 frame queries to bracket, 48 per bracket to refine, and one radius query per candidate; independent of the sweep's resolution.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call locates one point; callers locating many keep the compiled surface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const locateAutoMovieSweepPoint: (props: {
  surface: IAutoMovieSweepSurface;
  point: IAutoMovieVector3;
}) => {
  u: number;
  v: number;
  offset: number;
} = (props: {
  surface: IAutoMovieSweepSurface;
  point: IAutoMovieVector3;
}): {
  u: number;
  v: number;
  offset: number;
} => {
  const { surface, point }: typeof props = props;
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error("sweep point to locate is not finite");
  function plane(u: number): number {
    const f: IAutoMovieSweepFrame = surface.frame(u);
    return (
      (point.x - f.origin.x) * f.normal.x +
      (point.y - f.origin.y) * f.normal.y +
      (point.z - f.origin.z) * f.normal.z
    );
  }
  const candidates: number[] = [];
  let previous: number = plane(0);
  for (let k: number = 1; k <= SAMPLES; ++k) {
    const u: number = k / SAMPLES;
    const value: number = plane(u);
    if (previous === 0) candidates.push((k - 1) / SAMPLES);
    else if (previous * value < 0) {
      let a: number = (k - 1) / SAMPLES;
      let b: number = u;
      let fa: number = previous;
      for (let step: number = 0; step < BISECTIONS; ++step) {
        const middle: number = (a + b) / 2;
        const fm: number = plane(middle);
        if (fa * fm <= 0) b = middle;
        else {
          a = middle;
          fa = fm;
        }
      }
      candidates.push((a + b) / 2);
    }
    previous = value;
  }
  if (previous === 0) candidates.push(1);
  if (candidates.length === 0)
    candidates.push(Math.abs(plane(0)) <= Math.abs(plane(1)) ? 0 : 1);
  let best: {
    u: number;
    v: number;
    offset: number;
  } | null = null;
  for (const u of candidates) {
    const f: IAutoMovieSweepFrame = surface.frame(u);
    const d: IAutoMovieVector3 = {
      x: point.x - f.origin.x,
      y: point.y - f.origin.y,
      z: point.z - f.origin.z,
    };
    const x: number = d.x * f.x.x + d.y * f.x.y + d.z * f.x.z;
    const y: number = d.x * f.y.x + d.y * f.y.y + d.z * f.y.z;
    const turn: number = Math.atan2(y, x) / (2 * Math.PI);
    const v: number = turn - Math.floor(turn);
    const offset: number = Math.hypot(x, y) - surface.radius(u, v);
    if (best === null || Math.abs(offset) < Math.abs(best.offset))
      best = { u, v, offset };
  }
  return best!;
};
