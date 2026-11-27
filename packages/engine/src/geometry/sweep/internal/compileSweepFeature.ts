import type {
  IAutoMovieCompileSweepFeature,
  IAutoMovieCompileSweepFeatureOutput,
  IAutoMovieSweep,
} from "@automovie/interface";

import { interpolateSpline } from "./interpolateSpline";

/*
 * Compile one feature curve of a sweep into the radius change it makes at a
 * point of the sweep's domain.
 *
 * The curve is the centripetal Catmull-Rom spline through its points in the
 * `(u, angle)` domain, each angle unwrapped so consecutive points take the
 * shorter way round and a point repeating its predecessor dropped, continued
 * straight beyond its ends through reflected phantom points. Its knots are
 * spaced by the square root of each chord measured in metres, `u` by the
 * spine's length and angle by the sweep's mean radius, so each segment has no
 * cusp or self-intersection however unevenly its points are spaced (Yuksel,
 * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), and it is C1
 * in that knot parameter. Its radius or offset follows the same parameter by
 * `interpolateSpline`, so it too runs smoothly along the curve. At a
 * query point a nearest candidate on the curve is searched in a local
 * cylindrical metric: `u` scaled by the spine's length and angle by the query's
 * radius before features. This approximates surface distance; it is not the arc
 * metric of a noncircular section. The search seeds sixteen times the number of
 * segments uniformly over the knot span and refines the nearest seed by four
 * Newton steps. It keeps the seed if refinement moves further away; this local
 * search does not guarantee the global nearest point. Its smooth course removes
 * polyline corners, though a nearest-branch change inside a bend tighter than
 * the band can still crease the field. The radius moves by the residual there,
 * the declared radius less the surface's radius at the curve or the declared
 * offset, times `(1 - (d / width)^2)^3` within `width`, a falloff with
 * continuous curvature at the band's edge.
 * Parameter feature: The feature, validated, only read.
 * Parameter scale: The spine's length and the sweep's mean radius, metres, which
 * set the knot spacing.
 * Returns: The shared course in domain coordinates and the displacement at `u`
 * and `angle`, given the local radius, spine length and pre-feature radius.
 */
export const compileSweepFeature: (
  feature: IAutoMovieSweep.IFeature,
  scale: IAutoMovieCompileSweepFeature.IScale,
) => IAutoMovieCompileSweepFeatureOutput = (
  feature: IAutoMovieSweep.IFeature,
  scale: IAutoMovieCompileSweepFeature.IScale,
): IAutoMovieCompileSweepFeatureOutput => {
  // unwrap the angles so consecutive points take the shorter way round, and drop repeats
  const relative: boolean = feature.points[0]!.offset !== undefined;
  const points: Array<{ at: number; angle: number; value: number }> = [];
  for (const p of feature.points) {
    const last: { at: number; angle: number; value: number } | undefined =
      points[points.length - 1];
    const a: number =
      last === undefined
        ? p.angle
        : last.angle +
          (p.angle -
            last.angle -
            2 * Math.PI * Math.round((p.angle - last.angle) / (2 * Math.PI)));
    if (last !== undefined && last.at === p.at && last.angle === a) continue;
    points.push({
      at: p.at,
      angle: a,
      value: relative ? p.offset! : p.radius!,
    });
  }
  const n: number = points.length;
  const xs: Float64Array = Float64Array.from(
    points,
    (p: { at: number }): number => p.at,
  );
  const ys: Float64Array = Float64Array.from(
    points,
    (p: { angle: number }): number => p.angle,
  );
  // the point k in the domain, or a phantom point continuing the curve straight beyond its ends
  function at(array: Float64Array, k: number): number {
    return n === 1
      ? array[0]!
      : k < 0
        ? 2 * array[0]! - array[1]!
        : k >= n
          ? 2 * array[n - 1]! - array[n - 2]!
          : array[k]!;
  }
  // centripetal spacing: the square root of a chord in metres, phantom chords included
  function spacing(k: number): number {
    return Math.sqrt(
      Math.hypot(
        (at(xs, k + 1) - at(xs, k)) * scale.length,
        (at(ys, k + 1) - at(ys, k)) * scale.radius,
      ),
    );
  }
  const knots: Float64Array = new Float64Array(n);
  for (let k: number = 1; k < n; ++k) knots[k] = knots[k - 1]! + spacing(k - 1);
  const end: number = knots[n - 1]!;
  // each segment's Hermite end derivatives per unit of its local parameter, both axes
  const tangents: Float64Array = new Float64Array(4 * Math.max(0, n - 1));
  function slope(
    array: Float64Array,
    k: number,
    before: number,
    after: number,
  ): number {
    return (
      (at(array, k) - at(array, k - 1)) / before -
      (at(array, k + 1) - at(array, k - 1)) / (before + after) +
      (at(array, k + 1) - at(array, k)) / after
    );
  }
  for (let k: number = 0; k + 1 < n; ++k) {
    const span: number = spacing(k);
    const b0: number = spacing(k - 1);
    const b1: number = spacing(k + 1);
    tangents[4 * k] = slope(xs, k, b0, span) * span;
    tangents[4 * k + 1] = slope(ys, k, b0, span) * span;
    tangents[4 * k + 2] = slope(xs, k + 1, span, b1) * span;
    tangents[4 * k + 3] = slope(ys, k + 1, span, b1) * span;
  }
  const value: (s: number) => number =
    n === 1
      ? (): number => points[0]!.value
      : interpolateSpline({
          knots: Array.from(knots),
          values: points.map((p: { value: number }): number => p.value),
        });
  // the curve's coordinate, or its first or second derivative in the knot parameter, along one axis
  function curve(
    array: Float64Array,
    axis: number,
    s: number,
    order: number,
  ): number {
    if (n === 1) return order === 0 ? array[0]! : 0;
    let k: number = 0;
    let upper: number = n - 2;
    while (k < upper) {
      const middle: number = Math.ceil((k + upper) / 2);
      if (knots[middle]! <= s) k = middle;
      else upper = middle - 1;
    }
    const width: number = knots[k + 1]! - knots[k]!;
    const t: number = (s - knots[k]!) / width;
    const p0: number = array[k]!;
    const p1: number = array[k + 1]!;
    const m0: number = tangents[4 * k + axis]!;
    const m1: number = tangents[4 * k + 2 + axis]!;
    if (order === 0)
      return (
        (2 * t ** 3 - 3 * t * t + 1) * p0 +
        (t ** 3 - 2 * t * t + t) * m0 +
        (-2 * t ** 3 + 3 * t * t) * p1 +
        (t ** 3 - t * t) * m1
      );
    if (order === 1)
      return (
        ((6 * t * t - 6 * t) * p0 +
          (3 * t * t - 4 * t + 1) * m0 +
          (-6 * t * t + 6 * t) * p1 +
          (3 * t * t - 2 * t) * m1) /
        width
      );
    return (
      ((12 * t - 6) * p0 +
        (6 * t - 4) * m0 +
        (-12 * t + 6) * p1 +
        (6 * t - 2) * m1) /
      (width * width)
    );
  }
  const samples: number = DENSITY * Math.max(1, n - 1);
  const seedS: Float64Array = Float64Array.from(
    { length: samples + 1 },
    (_: unknown, j: number): number => (end * j) / samples,
  );
  const seedU: Float64Array = Float64Array.from(seedS, (s: number): number =>
    curve(xs, 0, s, 0),
  );
  const seedA: Float64Array = Float64Array.from(seedS, (s: number): number =>
    curve(ys, 1, s, 0),
  );
  const low: number = Math.min(...seedU);
  const high: number = Math.max(...seedU);
  function wrap(a: number): number {
    return a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
  }
  function displacement(
    u: number,
    angle: number,
    local: number,
    length: number,
    guided: (u: number, angle: number) => number,
  ): number {
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
    // refine on the curve: minimize the metric distance's square over the knot parameter near the seed
    const floor: number = seedS[Math.max(0, seed - 1)]!;
    const ceiling: number = seedS[Math.min(samples, seed + 1)]!;
    let s: number = seedS[seed]!;
    for (let k: number = 0; k < NEWTON && n > 1; ++k) {
      const ex: number = (u - curve(xs, 0, s, 0)) * length;
      const ey: number = wrap(angle - curve(ys, 1, s, 0)) * local;
      const dx: number = curve(xs, 0, s, 1) * length;
      const dy: number = curve(ys, 1, s, 1) * local;
      const gradient: number = -(ex * dx + ey * dy);
      const hessian: number =
        dx * dx +
        dy * dy -
        (ex * curve(xs, 0, s, 2) * length + ey * curve(ys, 1, s, 2) * local);
      if (!(hessian > 0)) break;
      s = Math.min(ceiling, Math.max(floor, s - gradient / hessian));
    }
    // keep the seed should the refinement wander off a nearer point
    if (
      Math.hypot(
        (u - curve(xs, 0, s, 0)) * length,
        wrap(angle - curve(ys, 1, s, 0)) * local,
      ) > best
    )
      s = seedS[seed]!;
    const on: number = curve(xs, 0, s, 0);
    const direction: number = curve(ys, 1, s, 0);
    const distance: number = Math.hypot(
      (u - on) * length,
      wrap(angle - direction) * local,
    );
    if (distance >= feature.width) return 0;
    const x: number = distance / feature.width;
    const residual: number = relative
      ? value(s)
      : value(s) - guided(on, direction);
    return residual * (1 - x * x) ** 3;
  }
  return {
    displacement,
    point: (t: number): { u: number; v: number } => {
      const s: number = Math.min(1, Math.max(0, t)) * end;
      return { u: curve(xs, 0, s, 0), v: curve(ys, 1, s, 0) / (2 * Math.PI) };
    },
  };
};

/*
 * Dense samples per curve segment that seed the nearest-point search.
 */
const DENSITY: number = 16;

/*
 * Newton steps that refine the nearest point on the curve.
 */
const NEWTON: number = 4;
