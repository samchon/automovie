type Point = [number, number, number];
type Cubic = [Point, Point, Point, Point];
interface Span {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  t0: number;
  t1: number;
  boundMm: number;
  observedEdgeIntervals: number;
}
interface FeaturePin {
  semantic: string;
  fraction: number;
}
interface Result {
  closed: boolean;
  segments: Span[];
  bounds: { lo: Point; hi: Point };
  boundMm: number;
  corners: number[];
  featurePins: { semantic: string; fraction: number; p: Point }[];
  joins: { t: number; continuity: "G1" | "C0"; angleDeg: number }[];
  observedPoints: number;
}
const add = (a: Point, b: Point): Point => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
const sub = (a: Point, b: Point): Point => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const mul = (a: Point, s: number): Point => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Point, b: Point): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: Point): number => Math.hypot(...a);
const unit = (a: Point): Point =>
  length(a) > 1e-12 ? mul(a, 1 / length(a)) : [0, 0, 0];
const lerp = (a: Point, b: Point, t: number): Point =>
  add(mul(a, 1 - t), mul(b, t));
const clamp = (x: number, a: number, b: number): number =>
  Math.min(b, Math.max(a, x));

function split(c: Cubic, t: number): [Cubic, Cubic] {
  const a: Point = lerp(c[0], c[1], t),
    b: Point = lerp(c[1], c[2], t),
    d: Point = lerp(c[2], c[3], t);
  const e: Point = lerp(a, b, t),
    f: Point = lerp(b, d, t),
    p: Point = lerp(e, f, t);
  return [
    [c[0], a, e, p],
    [p, f, d, c[3]],
  ];
}

function restrict(c: Cubic, a: number, b: number): Cubic {
  const left: Cubic = b < 1 ? split(c, b)[0] : c;
  return a > 0 ? split(left, a / b)[1] : left;
}

/**
 * Approximates an ordered reference polyline by bounded cubic spans in world millimetres.
 * Semantic pins use source arclength fractions; endpoints and coordinate extrema remain exact.
 * The certificate bounds the complete observed polygon, not unobserved smooth skin or a lofted surface.
 *
 * Each fit solves two tangent-handle lengths by arclength-weighted least squares, then subdivides
 * where a complete edge exceeds the requested bound. A degree-elevated edge subtracted from its
 * restricted cubic gives a difference curve whose control hull bounds pointwise displacement.
 * The endpoint and convex-hull properties follow the
 * [MIT shape interrogation text](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node12.html).
 * The 55 degree polygon-turn threshold is an operational corner policy, not anatomical evidence.
 *
 * Floating-point evaluation has a 1e-10 mm allowance and is not interval arithmetic; tolerance must exceed it.
 * Invalid coordinates or insufficient distinct observations throw before returning a fit.
 * Joins report G1 or C0 from actual controls; no C1, injectivity or anatomical claim is made.
 *
 * @evidence contracts/common.md#principled-implementation Tangent-constrained cubic least squares is qualified by a complete polygon difference-control bound; topology and between-section surface quality remain outside this operation.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation owns fitting, exact pins, dimensional bounds and join metadata; its inputs and output contain no mesh topology or filesystem state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity, fixture, package consumer or anatomical answer is special-cased; the declared corner policy applies to every observed polygon.
 * @evidence contracts/common.md#meaningful-documentation Documents world units, arclength semantics, exact pins, numerical limits, actual continuity and failure behavior with the mathematical source.
 * @evidence contracts/performance.md#efficient-algorithms Each recursive span scans its observed edges for fitting and certification; balanced splits cost O(n log n), worst-case unbalanced splits O(n squared), with O(n) retained controls and recursive depth up to O(n).
 * @evidence contracts/performance.md#reuse-equivalent-work Arclength, global bounds and endpoint directions are computed once per input curve; independent calls share no state or cached identity assumptions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays and closures belong to one synchronous call; no handles, processes, files or cross-call cache are acquired, and memory is released with the returned result and stack.
 */
export function fitCurve(
  input: Point[],
  toleranceMm: number,
  requestedPins: FeaturePin[] = [],
  closed: boolean = true,
): Result {
  if (!Number.isFinite(toleranceMm) || !(toleranceMm > 1e-10))
    throw new Error(
      "Fit tolerance must exceed the 1e-10 mm floating-point allowance",
    );
  if (
    input.some(
      (p: Point): boolean =>
        p.length !== 3 ||
        p.some((value: number): boolean => !Number.isFinite(value)),
    )
  )
    throw new Error("Finite world-mm observations required");
  if (
    requestedPins.some(
      (pin: FeaturePin): boolean =>
        !Number.isFinite(pin.fraction) || pin.fraction < 0 || pin.fraction > 1,
    )
  )
    throw new Error("Semantic pin arclength fractions must lie in [0,1]");
  let points: Point[] = input.filter(
    (p: Point, i: number): boolean => !i || length(sub(p, input[i - 1])) > 0,
  );
  if (
    closed &&
    points.length > 1 &&
    length(sub(points[0], points[points.length - 1])) === 0
  )
    points.pop();
  const observedPoints: number = points.length;
  if (observedPoints < (closed ? 3 : 2))
    throw new Error("Insufficient non-coincident curve observations");
  const sourceArc: number[] = [0];
  const sourceEdges: number = points.length - (closed ? 0 : 1);
  for (let i: number = 0; i < sourceEdges; i++)
    sourceArc.push(
      sourceArc[i] + length(sub(points[(i + 1) % points.length], points[i])),
    );
  const normalizedPins: FeaturePin[] = requestedPins.map(
    (pin: FeaturePin): FeaturePin => ({
      semantic: pin.semantic,
      fraction: closed && pin.fraction === 1 ? 0 : pin.fraction,
    }),
  );
  const augmented: Point[] = [],
    featureIndices: { semantic: string; index: number }[] = [];
  for (let i: number = 0; i < sourceEdges; i++) {
    const start: number = sourceArc[i] / sourceArc[sourceEdges],
      end: number = sourceArc[i + 1] / sourceArc[sourceEdges];
    augmented.push(points[i]);
    const local: FeaturePin[] = normalizedPins
      .filter(
        (pin: FeaturePin): boolean =>
          pin.fraction >= start - 1e-12 && pin.fraction < end - 1e-12,
      )
      .sort((a: FeaturePin, b: FeaturePin): number => a.fraction - b.fraction);
    let previous: number = start;
    for (const pin of local) {
      if (pin.fraction - previous > 1e-12)
        augmented.push(
          lerp(
            points[i],
            points[(i + 1) % points.length],
            (pin.fraction - start) / (end - start),
          ),
        );
      featureIndices.push({
        semantic: pin.semantic,
        index: augmented.length - 1,
      });
      previous = pin.fraction;
    }
  }
  if (!closed) {
    augmented.push(points[points.length - 1]);
    for (const pin of normalizedPins)
      if (Math.abs(pin.fraction - 1) < 1e-12)
        featureIndices.push({
          semantic: pin.semantic,
          index: augmented.length - 1,
        });
  }
  points = augmented;
  const n: number = points.length;
  if (n < (closed ? 3 : 2))
    throw new Error("Insufficient non-coincident curve observations");
  const lo: Point = [Infinity, Infinity, Infinity],
    hi: Point = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let k: number = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p[k]);
      hi[k] = Math.max(hi[k], p[k]);
    }
  const pins: Set<number> = new Set([
    0,
    ...featureIndices.map(
      (pin: { semantic: string; index: number }): number => pin.index,
    ),
  ]);
  for (let k: number = 0; k < 3; k++) {
    if (hi[k] - lo[k] < 1e-8) continue;
    pins.add(points.findIndex((p: Point): boolean => p[k] === lo[k]));
    pins.add(points.findIndex((p: Point): boolean => p[k] === hi[k]));
  }
  const cornerSet: Set<number> = new Set();
  const tangents: Point[] = points.map((p: Point, i: number): Point => {
    if (!closed && i === 0) return unit(sub(points[1], p));
    if (!closed && i === n - 1) return unit(sub(p, points[n - 2]));
    const prev: Point = points[(i + n - 1) % n],
      next: Point = points[(i + 1) % n];
    const incoming: Point = unit(sub(p, prev)),
      outgoing: Point = unit(sub(next, p));
    if (dot(incoming, outgoing) < Math.cos((55 * Math.PI) / 180)) {
      pins.add(i);
      cornerSet.add(i);
    }
    const t: Point = add(incoming, outgoing);
    // Global coordinate extrema are interpolation pins and their tangent cannot leave the measured box.
    for (let k: number = 0; k < 3; k++)
      if (Math.abs(p[k] - lo[k]) < 1e-9 || Math.abs(p[k] - hi[k]) < 1e-9)
        t[k] = 0;
    return unit(t);
  });
  const cumulative: number[] = [0];
  const edgeCount: number = n - (closed ? 0 : 1);
  for (let i: number = 0; i < edgeCount; i++)
    cumulative.push(
      cumulative[i] + length(sub(points[(i + 1) % n], points[i])),
    );
  const perimeter: number = cumulative[edgeCount];
  pins.delete(edgeCount);
  const ordered: number[] = [...pins].sort(
    (a: number, b: number): number => a - b,
  );
  ordered.push(edgeCount);
  const point = (i: number): Point => points[i % n];
  const tangent = (i: number, outgoing: boolean): Point =>
    cornerSet.has(i % n) || length(tangents[i % n]) === 0
      ? unit(
          outgoing
            ? sub(point(i + 1), point(i))
            : sub(point(i), point(i + n - 1)),
        )
      : tangents[i % n];
  const handleLimit = (p: Point, d: Point): number => {
    let result: number = Infinity;
    for (let k: number = 0; k < 3; k++)
      if (Math.abs(d[k]) > 1e-12)
        result = Math.min(
          result,
          (d[k] > 0 ? hi[k] - p[k] : lo[k] - p[k]) / d[k],
        );
    return Math.max(0, result);
  };
  const fit = (a: number, b: number): Cubic => {
    const p: Point = point(a),
      q: Point = point(b),
      ta: Point = tangent(a, true),
      tb: Point = tangent(b, false);
    const arc: number = cumulative[b] - cumulative[a];
    let aa: number = 0,
      ab: number = 0,
      bb: number = 0,
      ra: number = 0,
      rb: number = 0;
    for (let i: number = a; i <= b; i++) {
      const t: number = (cumulative[i] - cumulative[a]) / arc,
        u: number = 1 - t;
      const b0: number = u ** 3,
        b1: number = 3 * u * u * t,
        b2: number = 3 * u * t * t,
        b3: number = t ** 3;
      const residual: Point = sub(
        point(i),
        add(mul(p, b0 + b1), mul(q, b2 + b3)),
      );
      const weight: number =
        ((i > a ? cumulative[i] - cumulative[i - 1] : 0) +
          (i < b ? cumulative[i + 1] - cumulative[i] : 0)) /
        (2 * arc);
      aa += weight * b1 * b1;
      ab -= weight * b1 * b2 * dot(ta, tb);
      bb += weight * b2 * b2;
      ra += weight * b1 * dot(ta, residual);
      rb -= weight * b2 * dot(tb, residual);
    }
    const determinant: number = aa * bb - ab * ab;
    let alpha: number = arc / 3,
      beta: number = arc / 3;
    if (determinant > 1e-14) {
      alpha = (ra * bb - rb * ab) / determinant;
      beta = (rb * aa - ra * ab) / determinant;
    }
    // A non-positive least-squares handle has no meaningful forward tangent; use a bounded chord-length initialization.
    if (!(alpha > 1e-10)) alpha = arc / 3;
    if (!(beta > 1e-10)) beta = arc / 3;
    alpha = Math.min(alpha, handleLimit(p, ta));
    beta = Math.min(beta, handleLimit(q, mul(tb, -1)));
    return [p, add(p, mul(ta, alpha)), sub(q, mul(tb, beta)), q];
  };
  const certify = (
    c: Cubic,
    a: number,
    b: number,
  ): { bound: number; splitAt: number } => {
    const arc: number = cumulative[b] - cumulative[a];
    let bound: number = 0,
      splitAt: number = Math.floor((a + b) / 2);
    for (let i: number = a; i < b; i++) {
      const t0: number = (cumulative[i] - cumulative[a]) / arc,
        t1: number = (cumulative[i + 1] - cumulative[a]) / arc;
      const piece: Cubic = restrict(c, t0, t1),
        pa: Point = point(i),
        pb: Point = point(i + 1);
      const linear: Cubic = [pa, lerp(pa, pb, 1 / 3), lerp(pa, pb, 2 / 3), pb];
      const error: number = Math.max(
        ...piece.map((p: Point, k: number): number =>
          length(sub(p, linear[k])),
        ),
      );
      if (error > bound) {
        bound = error;
        splitAt = clamp(i + 1, a + 1, b - 1);
      }
    }
    return { bound: bound + 1e-10, splitAt };
  };
  const segments: Span[] = [];
  const visit = (a: number, b: number): void => {
    let controls: Cubic = fit(a, b);
    let assessment: { bound: number; splitAt: number } = certify(
      controls,
      a,
      b,
    );
    if (assessment.bound > toleranceMm && b - a > 1) {
      visit(a, assessment.splitAt);
      visit(assessment.splitAt, b);
      return;
    }
    if (assessment.bound > toleranceMm) {
      // A single source edge is exactly representable; mark its actual join continuity below rather than claiming smoothness.
      controls = [
        point(a),
        lerp(point(a), point(b), 1 / 3),
        lerp(point(a), point(b), 2 / 3),
        point(b),
      ];
      assessment = certify(controls, a, b);
    }
    if (!Number.isFinite(assessment.bound) || assessment.bound > toleranceMm)
      throw new Error("Requested fit bound is below numerical resolution");
    segments.push({
      p0: controls[0],
      p1: controls[1],
      p2: controls[2],
      p3: controls[3],
      t0: cumulative[a] / perimeter,
      t1: cumulative[b] / perimeter,
      boundMm: assessment.bound,
      observedEdgeIntervals: b - a,
    });
  };
  for (let i: number = 1; i < ordered.length; i++)
    visit(ordered[i - 1], ordered[i]);
  const joins: Result["joins"] = segments.flatMap(
    (span: Span, i: number): Result["joins"] => {
      if (!closed && i === 0) return [];
      const prev: Span = segments[(i + segments.length - 1) % segments.length];
      const a: Point = unit(sub(prev.p3, prev.p2)),
        b: Point = unit(sub(span.p1, span.p0));
      const angleDeg: number =
        (Math.acos(clamp(dot(a, b), -1, 1)) * 180) / Math.PI;
      return [
        {
          t: span.t0,
          continuity:
            angleDeg < 1e-5 && length(a) > 0 && length(b) > 0 ? "G1" : "C0",
          angleDeg,
        },
      ];
    },
  );
  return {
    closed,
    segments,
    bounds: { lo, hi },
    boundMm: Math.max(...segments.map((s: Span): number => s.boundMm)),
    corners: [...cornerSet].map(
      (i: number): number => cumulative[i] / perimeter,
    ),
    featurePins: featureIndices.map(
      (pin: {
        semantic: string;
        index: number;
      }): Result["featurePins"][number] => ({
        semantic: pin.semantic,
        fraction: cumulative[pin.index] / perimeter,
        p: points[pin.index],
      }),
    ),
    joins,
    observedPoints,
  };
}
