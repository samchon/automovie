import { millimetrePoint as p } from "./millimetrePoint";
import type { Point } from "./structures/Point";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";


/**
 * Uniform Catmull-Rom interpolation through at least two ordered landmarks.
 * Progress is clamped, and endpoint neighbours repeat rather than extrapolate.
 * This is a spatial curve, not an arc-length parameterization.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Uniform cubic Catmull-Rom uses four adjacent supports with repeated endpoint neighbours/clamped finite progress. Admitted hair/brow/mouth/ear/skin guides supply at least two finite head-millimetre points; this is not arc-length interpolation and may overshoot.
 * @evidence contracts/common.md#clear-and-simple-design One three-axis polynomial shares guide semantics across component owners; the point constructor supplies common representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint repetition/clamping are curve conventions. Short/nonfinite guides are not admitted here, and interpolation proves no monotonicity, nonintersection or clinical shape.
 * @evidence contracts/common.md#meaningful-documentation Prose gives ordered support, endpoint repetition, clamped progress and non-arc-length semantics; result is fresh and inputs unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Four indexed supports and three cubics take fixed work per point independent of guide length, with no full-guide scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Components share one formula and current control selection; changed guide/progress evaluates anew without a retained coordinate cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh point transfers and controls are borrowed; no guide copy, history or external resource is retained.
 */
export const catmullRomPoint: (points: Point[], progress: number) => Point = (points: Point[], progress: number): Point => {
  const t: number = Math.max(0, Math.min(1, progress)) * (points.length - 1);
  const i: number = Math.min(points.length - 2, Math.floor(t)),
    u: number = t - i;
  const a: IAutoMovieVector3Imported = points[Math.max(0, i - 1)],
    b: IAutoMovieVector3Imported = points[i],
    c: IAutoMovieVector3Imported = points[i + 1],
    d: IAutoMovieVector3Imported = points[Math.min(points.length - 1, i + 2)];
  const component: (axis: "x" | "y" | "z") => number = (axis: "x" | "y" | "z"): number =>
    0.5 *
    (2 * b[axis] +
      (-a[axis] + c[axis]) * u +
      (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * u * u +
      (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * u * u * u);
  return p(component("x"), component("y"), component("z"));
};
