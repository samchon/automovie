import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";

/** Dense samples per curve segment that seed the nearest-point search. */
const DENSITY: number = 16;

/** Newton steps that refine the nearest point on the curve. */
const NEWTON: number = 4;

/**
 * Compile one feature curve of a sweep into the radius change it makes at a
 * point of the sweep's domain.
 *
 * The curve is the uniform Catmull-Rom spline through its points in the
 * `(u, angle)` domain, each angle unwrapped so consecutive points take the
 * shorter way round, continued straight beyond its ends through reflected
 * phantom points; being affine-invariant, its shape does not depend on how
 * `u` and angle are scaled. Its radius or offset follows the curve parameter
 * by `interpolateAutoMovieSpline`. At a query point the nearest point of the
 * curve is found in the surface's own metric, `u` scaled by the spine's
 * length and angle by the query's radius before features, from 16 samples a
 * segment refined by four Newton steps on the curve parameter, so the
 * distance is the distance to the smooth curve and its field has no crease
 * where a polyline would turn; it creases only inside a bend tighter than
 * the band is wide, where two arms of the curve lie equally near, so keep a
 * band narrower than its curve's radius of curvature. The radius moves by
 * the residual there, the
 * declared radius less the surface's radius at the curve or the declared
 * offset, times `(1 - (d / width)^2)^3` within `width`, a falloff with
 * continuous curvature at the band's edge.
 *
 * @param feature The feature, validated, only read.
 * @returns The displacement at `u` and `angle`, given the local radius, the spine's length and the surface's radius before features.
 *
 * @evidence contracts/common.md#principled-implementation A pass-through constraint along a smooth curve: the C1 Catmull-Rom curve through the points, the exact nearest point by Newton's method from a dense seed, and a compactly supported C2 falloff of the residual in the surface's own metric.
 * @evidence contracts/common.md#clear-and-simple-design The curve, its values and its seed samples are built once; a query is a reject on the band's `u` range, a seed scan and a short refinement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The curve passes through every declared point and value; nothing is smoothed away.
 * @evidence contracts/common.md#meaningful-documentation States the curve, its values, the metric, the nearest-point search, the residual and the falloff.
 * @evidence contracts/performance.md#efficient-algorithms For n points: compile O(n); a query outside the band's `u` range is O(1), otherwise O(16 n) for the seed plus four Newton steps, with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The curve coefficients, seed samples and value spline are built once per sweep compile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains O(16 n) seed samples and the value spline, released with the sweep.
 */
export const compileAutoMovieSweepFeature: (
  feature: IAutoMovieSweep.IFeature,
) => (
  u: number,
  angle: number,
  local: number,
  length: number,
  guided: (u: number, angle: number) => number,
) => number = (
  feature: IAutoMovieSweep.IFeature,
): ((
  u: number,
  angle: number,
  local: number,
  length: number,
  guided: (u: number, angle: number) => number,
) => number) => {
  const n: number = feature.points.length;
  // unwrap the angles so consecutive points take the shorter way round
  let previous: number = feature.points[0]!.angle;
  const xs: Float64Array = Float64Array.from(
    feature.points,
    (p: IAutoMovieSweep.IFeaturePoint): number => p.at,
  );
  const ys: Float64Array = Float64Array.from(
    feature.points,
    (p: IAutoMovieSweep.IFeaturePoint, k: number): number => {
      if (k === 0) return previous;
      let step: number = p.angle - previous;
      step -= 2 * Math.PI * Math.round(step / (2 * Math.PI));
      previous += step;
      return previous;
    },
  );
  const relative: boolean = feature.points[0]!.offset !== undefined;
  const value: (s: number) => number = interpolateAutoMovieSpline({
    knots: feature.points.map(
      (_: IAutoMovieSweep.IFeaturePoint, k: number): number => k,
    ),
    values: feature.points.map((p: IAutoMovieSweep.IFeaturePoint): number =>
      relative ? p.offset! : p.radius!,
    ),
  });
  // point k, or a phantom point continuing the curve straight beyond its ends
  const point = (array: Float64Array, k: number): number =>
    k < 0
      ? 2 * array[0]! - array[1]!
      : k >= n
        ? 2 * array[n - 1]! - array[n - 2]!
        : array[k]!;
  // the curve's coordinate, first or second derivative at parameter s along one axis
  const curve = (array: Float64Array, s: number, order: number): number => {
    const k: number = Math.min(n - 2, Math.max(0, Math.floor(s)));
    const t: number = s - k;
    const p0: number = point(array, k - 1);
    const p1: number = point(array, k);
    const p2: number = point(array, k + 1);
    const p3: number = point(array, k + 2);
    const a: number = -p0 + 3 * p1 - 3 * p2 + p3;
    const b: number = 2 * p0 - 5 * p1 + 4 * p2 - p3;
    const c: number = -p0 + p2;
    if (order === 0) return 0.5 * (2 * p1 + c * t + b * t * t + a * t * t * t);
    if (order === 1) return 0.5 * (c + 2 * b * t + 3 * a * t * t);
    return 0.5 * (2 * b + 6 * a * t);
  };
  const samples: number = DENSITY * (n - 1);
  const seedU: Float64Array = Float64Array.from(
    { length: samples + 1 },
    (_: unknown, j: number): number => curve(xs, j / DENSITY, 0),
  );
  const seedA: Float64Array = Float64Array.from(
    { length: samples + 1 },
    (_: unknown, j: number): number => curve(ys, j / DENSITY, 0),
  );
  const low: number = Math.min(...seedU);
  const high: number = Math.max(...seedU);
  const wrap = (a: number): number =>
    a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
  return (
    u: number,
    angle: number,
    local: number,
    length: number,
    guided: (u: number, angle: number) => number,
  ): number => {
    // the band reaches no further along the spine than its width
    if (
      (low - u) * length >= feature.width ||
      (u - high) * length >= feature.width
    )
      return 0;
    let best: number = Infinity;
    let seed: number = 0;
    for (let j: number = 0; j <= samples; ++j) {
      const d: number = Math.hypot(
        (u - seedU[j]!) * length,
        wrap(angle - seedA[j]!) * local,
      );
      if (d < best) {
        best = d;
        seed = j;
      }
    }
    // refine on the curve: minimize the metric distance's square over the parameter near the seed
    const floor: number = Math.max(0, (seed - 1) / DENSITY);
    const ceiling: number = Math.min(n - 1, (seed + 1) / DENSITY);
    let s: number = seed / DENSITY;
    for (let k: number = 0; k < NEWTON; ++k) {
      const ex: number = (u - curve(xs, s, 0)) * length;
      const ey: number = wrap(angle - curve(ys, s, 0)) * local;
      const dx: number = curve(xs, s, 1) * length;
      const dy: number = curve(ys, s, 1) * local;
      const gradient: number = -(ex * dx + ey * dy);
      const hessian: number =
        dx * dx +
        dy * dy -
        (ex * curve(xs, s, 2) * length + ey * curve(ys, s, 2) * local);
      if (!(hessian > 0)) break;
      s = Math.min(ceiling, Math.max(floor, s - gradient / hessian));
    }
    // keep the seed should the refinement wander off a nearer point
    if (
      Math.hypot(
        (u - curve(xs, s, 0)) * length,
        wrap(angle - curve(ys, s, 0)) * local,
      ) > best
    )
      s = seed / DENSITY;
    const at: number = curve(xs, s, 0);
    const direction: number = curve(ys, s, 0);
    const distance: number = Math.hypot(
      (u - at) * length,
      wrap(angle - direction) * local,
    );
    if (distance >= feature.width) return 0;
    const x: number = distance / feature.width;
    const residual: number = relative
      ? value(s)
      : value(s) - guided(at, direction);
    return residual * (1 - x * x) ** 3;
  };
};
