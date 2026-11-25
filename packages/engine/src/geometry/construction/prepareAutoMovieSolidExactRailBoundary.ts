import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

type Point = readonly [number, number];
type Cubic = readonly [number, number, number, number];

/**
 * The side and nearest clock of one closed, zero-winding periodic chart spline.
 * Both read the supplied spline in its lifted chart, allowing nonradial loops.
 * Side is negative inside, zero on the represented curve, and positive outside.
 * A chart-metric foot supplies the same boundary point to the adjacent chart.
 * The atlas settles the world-space equations on the actual receiving surface.
 */
export function prepareAutoMovieSolidExactRailBoundary(
  controls: readonly number[],
  points: readonly Point[],
  period: number | undefined,
): {
  clock(u: number, v: number): number;
  side(u: number, v: number): number;
} | null {
  const count = points.length;
  if (
    count < 4 ||
    controls.length !== 2 * count ||
    !controls.every(Number.isFinite)
  )
    return null;
  const step = (2 * Math.PI) / count;
  const centre: Point = [
    points.reduce((sum, p) => sum + p[0], 0) / count,
    points.reduce((sum, p) => sum + p[1], 0) / count,
  ];
  const normalization = Math.max(
    ...points.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1])),
  );
  if (!(normalization > 0 && Number.isFinite(normalization))) return null;
  // The original spline is evaluated before translation. Preserve its chart
  // rounding in the same binary64 scale as the polynomial root owner.
  const resolution =
    (64 *
      Number.EPSILON *
      Math.max(normalization, Math.abs(centre[0]), Math.abs(centre[1]))) /
    normalization;
  const normalize = (u: number, v: number): Point => [
    (u - centre[0]) / normalization,
    (AutoMovieSolidCycle.shift(v, centre[1], period) - centre[1]) /
      normalization,
  ];
  const knots = points.map((_, k) => {
    const [u, v, du, dv] = AutoMovieSplineCurve.evaluate(
      controls,
      count,
      k * step,
    );
    return {
      point: [
        (u - centre[0]) / normalization,
        (v - centre[1]) / normalization,
      ] as Point,
      slope: [
        (du * step) / normalization,
        (dv * step) / normalization,
      ] as Point,
    };
  });
  const spans = knots.map((a, i) => {
    const b = knots[(i + 1) % count]!;
    const coordinate = (axis: 0 | 1): Cubic => {
      const p = a.point[axis];
      const q = b.point[axis];
      const d = a.slope[axis];
      const e = b.slope[axis];
      return [p, d, 3 * (q - p) - 2 * d - e, 2 * (p - q) + d + e];
    };
    const x = coordinate(0);
    const y = coordinate(1);
    const xBounds = bounds(x);
    const yCuts = critical(y);
    const runs = yCuts.slice(0, -1).map((lo, k) => {
      const hi = yCuts[k + 1]!;
      const first = evaluate(y, lo);
      const last = evaluate(y, hi);
      return {
        lo,
        hi,
        first,
        last,
        min: Math.min(first, last),
        max: Math.max(first, last),
      };
    });
    const vertical = yCuts.map((t) => evaluate(y, t));
    return {
      x,
      y,
      xBounds,
      yBounds: [Math.min(...vertical), Math.max(...vertical)] as Point,
      runs,
    };
  });

  return {
    clock: (u, v) => {
      const [x, y] = normalize(u, v);
      let best = Infinity;
      let phase = 0;
      for (const [i, span] of spans.entries()) {
        const dx = Math.max(span.xBounds[0] - x, 0, x - span.xBounds[1]);
        const dy = Math.max(span.yBounds[0] - y, 0, y - span.yBounds[1]);
        if (dx * dx + dy * dy > best) continue;
        const px = [span.x[0] - x, ...span.x.slice(1)];
        const py = [span.y[0] - y, ...span.y.slice(1)];
        const derivative = new Array<number>(6).fill(0);
        for (let a = 0; a < 4; a++)
          for (let b = 1; b < 4; b++)
            derivative[a + b - 1]! +=
              b * (px[a]! * span.x[b]! + py[a]! * span.y[b]!);
        for (const t of [0, 1, ...rootsAutoMovieViewPolynomial(derivative)]) {
          const ex = evaluate(span.x, t) - x;
          const ey = evaluate(span.y, t) - y;
          const distance = ex * ex + ey * ey;
          if (distance < best) {
            best = distance;
            phase = (i + t) * step;
          }
        }
      }
      return phase;
    },
    side: (u, v) => {
      const [x, y] = normalize(u, v);
      let odd = false;
      for (const span of spans) {
        if (
          x > span.xBounds[1] + resolution ||
          y < span.yBounds[0] - resolution ||
          y > span.yBounds[1] + resolution
        )
          continue;
        if (
          x >= span.xBounds[0] - resolution &&
          span.yBounds[1] - span.yBounds[0] <= resolution
        )
          return 0;
        for (const run of span.runs) {
          // Check both endpoints independently of crossing parity. A high
          // endpoint can lie on the curve even though its run is half-open.
          if (
            x >= span.xBounds[0] - resolution &&
            ((Math.abs(y - run.first) <= resolution &&
              Math.abs(x - evaluate(span.x, run.lo)) <= resolution) ||
              (Math.abs(y - run.last) <= resolution &&
                Math.abs(x - evaluate(span.x, run.hi)) <= resolution))
          )
            return 0;
          // A half-open vertical range counts a transverse vertex once and
          // counts the two incident branches at a local extremum together.
          if (!(y >= run.min && y < run.max)) continue;
          if (x < span.xBounds[0]) {
            odd = !odd;
            continue;
          }
          const t = level(span.y, run.lo, run.hi, y, run.last > run.first);
          const hit = evaluate(span.x, t);
          if (Math.abs(hit - x) <= resolution) return 0;
          if (hit > x) odd = !odd;
        }
      }
      return odd ? -1 : 1;
    },
  };
}

/** Values at extrema bound one complete spline span. */
function bounds(curve: Cubic): Point {
  const values = critical(curve).map((t) => evaluate(curve, t));
  return [Math.min(...values), Math.max(...values)];
}

function critical(curve: Cubic): number[] {
  return [
    0,
    ...rootsAutoMovieViewPolynomial([
      curve[1],
      2 * curve[2],
      3 * curve[3],
    ]).filter((t) => t > 0 && t < 1),
    1,
  ];
}

function evaluate(curve: Cubic, t: number): number {
  return curve[0] + t * (curve[1] + t * (curve[2] + t * curve[3]));
}

/** Invert the coordinate on one of its monotone cubic intervals. */
function level(
  curve: Cubic,
  first: number,
  last: number,
  target: number,
  rising: boolean,
): number {
  let lo = first;
  let hi = last;
  // A unit interval needs 53 halvings to resolve the binary64 significand.
  // Match the existing polynomial root owner's 60-step bracket.
  for (let iteration = 0; iteration < 60; iteration++) {
    const t = (lo + hi) / 2;
    if (t === lo || t === hi) return t;
    const error = evaluate(curve, t) - target;
    if (error === 0) return t;
    if (error < 0 === rising) lo = t;
    else hi = t;
  }
  return (lo + hi) / 2;
}
