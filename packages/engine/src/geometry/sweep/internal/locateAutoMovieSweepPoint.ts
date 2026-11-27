import {
  type IAutoMovieLocateSweepPoint,
  type IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Even samples of the spine parameter a sign change of the plane distance is
 * bracketed between.
 */
const SAMPLES: number = 128;
/*
 * Bisection steps that place the plane on the point; each halves the bracket.
 */
const BISECTIONS: number = 48;
/*
 * Locate a point against a direction-correspondence sweep's sampled section
 * planes.
 *
 * Signed plane distance is sampled over 128 equal intervals; sign changes are
 * bisected 48 times and exact sample roots retained. The candidate with
 * smallest absolute radial offset wins. If no root is detected, the nearer end
 * plane is used. Tangential roots or multiple roots between probes can be
 * missed, so that fallback does not prove a point is beyond an end. Polar turns
 * match the surface parameter only for direction correspondence; parameter
 * correspondence is rejected. Offset is signed in-plane radial distance, not
 * Euclidean distance to the surface or a global closest-point certificate.
 * Parameter props.surface: The compiled sweep, only read.
 * Parameter props.point: The point, metres.
 * Returns: `u`, the spine parameter of the section plane holding the point, 0
 * to 1; `v`, the point's polar direction in that plane, a turn from 0 to 1;
 * and `offset`, its distance outside the surface along that direction in
 * metres, negative inside.
 * Error when the point is not finite or correspondence is parameter.
 */
export const locateAutoMovieSweepPoint: (
  props: IAutoMovieLocateSweepPoint.IProps,
) => IAutoMovieLocateSweepPoint.IResult = (
  props: IAutoMovieLocateSweepPoint.IProps,
): IAutoMovieLocateSweepPoint.IResult => {
  const { surface, point }: typeof props = props;
  if (surface.sweep.correspondence === "parameter")
    throw new Error("sweep point location requires direction correspondence");
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
