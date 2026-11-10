import { AutoMovieRecoveryConicApproximation as C } from "./AutoMovieRecoveryConicApproximation";

/**
 * Construct G1 bitangent conics using Ahn's control-triangle subdivision scheme.
 *
 * Basis: Y. J. Ahn, Conic approximation of planar curves, CAD 33 (2001),
 * 867-872, doi:10.1016/S0010-4485(00)00110-X. The public primary abstract and
 * section preview establish endpoint tangent interpolation, positive fullness
 * factor and subdivision into a containing tangent triangle. The inaccessible
 * characterization theorem and its specific error function are NOT reproduced.
 * This explicitly labelled adaptation minimizes a sampled radial-correspondence
 * maximum distance instead: each source point and conic point lie on the same
 * ray from the tangent intersection. Its signed displacement increases with the
 * weight, so bisection balances positive and negative extreme discrepancies.
 *
 * Samples at odd 1/32 intervals validate weights fitted on even intervals.
 * Their distance is an observable discrepancy, never a continuous Hausdorff
 * bound. A complete result only covers the supplied chart within this sampled
 * criterion. Inflections and inadmissible triangles cause bisection; exhausted
 * budgets omit unresolved intervals and return partial. Finite straight charts
 * admit an explicit collinear quadratic. Source callbacks are borrowed and must
 * be deterministic; callback failures or nonfinite data refuse the whole call.
 * Incident endpoint jets request exact right/left limits so supplied breaks
 * preserve genuine source corners without finite-difference displacements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the paper and inaccessible theorem, alternative error objective, parameterization, sampled validation, straight degeneracy and refusal/budget effects.
 * @evidence contracts/development/implementation.md#principled-implementation Endpoint tangent intersection fixes the rational quadratic control triangle. Ahn's published triangle subdivision supplies the construction; this declared adaptation uses monotone radial displacement rather than claiming the unavailable characterization or certified bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure operation owns admission, coefficient fitting and bounded interval subdivision, using the shared recovery contract and no source format or renderer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source file, specimen coordinates, fallback mesh, least-squares replacement or unlabelled theorem claim enters the computation. Binary64 roundoff thresholds depend on local scale; tolerance and work budgets come from the caller.
 * @evidence contracts/development/implementation.md#efficient-algorithms With L visited leaves, constant 33-point observation, 48-step scalar bisection and fixed-size validation cost O(L) time; the arc and interval population is bounded by maximumArcs and depth by maximumDepth.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each interval's points and derivatives are observed once and reused during all weight iterations; no cross-call cache assumes callback equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Source callbacks and temporary arrays remain call-local; the returned coefficients contain no source samples, and no file, task or process is acquired.
 */
export function approximateAutoMovieRecoveryConicsAhn(
  curve: C.ICurve,
  options: C.IOptions,
): C.IResult {
  const method: string = "Ahn 2001 triangle construction / sampled radial-minimax adaptation";
  const diagnostics: string[] = C.validate(curve, options);
  const arcs: C.IArc[] = [];
  let queries: number = 0;
  let unresolved: number = 0;
  const reasons: Map<string, number> = new Map();

  /** Assemble evidence without retaining callback closures or observed samples. */
  const result: (status: C.IResult["status"]) => C.IResult = (
    status: C.IResult["status"],
  ): C.IResult => ({
    method,
    status,
    arcs: status === "refused" ? [] : arcs,
    diagnostics,
    maximumSampleErrorMm: status === "refused" ? 0 : arcs.reduce(
      (maximum: number, arc: C.IArc): number => Math.max(maximum, arc.maximumSampleErrorMm),
      0,
    ),
    certified: false,
    queries,
  });
  if (diagnostics.length !== 0) return result("refused");
  diagnostics.push("Numerical adaptation: Ahn's full characterization theorem/error function was unavailable; radial-correspondence samples do not certify Hausdorff distance or global minimality.");

  /** Reject corrupt observations rather than creating substitute coordinates. */
  const observe: (t: number, order?: 1 | 2 | 3, side?: "left" | "right") => C.Point = (
    t: number,
    order?: 1 | 2 | 3,
    side?: "left" | "right",
  ): C.Point => {
    ++queries;
    const p: C.Point = order === undefined ? curve.evaluate(t) : curve.derivative(t, order, side);
    if (p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))
      throw new Error(`Nonfinite source ${order === undefined ? "point" : "derivative"} at parameter ${t}.`);
    // A source evaluator may reuse a scratch tuple. Snapshot the value now so
    // later source queries cannot change observed points or returned controls.
    return [p[0], p[1]];
  };

  /** Source-minus-origin vectors keep determinants translation invariant. */
  const minus: (a: C.Point, b: C.Point) => C.Point = (a: C.Point, b: C.Point): C.Point => [a[0] - b[0], a[1] - b[1]];

  /** A work item retains only source interval, subdivision depth and its cause. */
  interface Interval {
    a: number;
    b: number;
    depth: number;
  }

  /** A radial correspondence needs no nearest-point solve during weight search. */
  interface Radial {
    u: number;
    apex: number;
    scale: number;
    idealWeight: number;
  }

  /**
   * Attempt one admissible triangle. Undefined requests source subdivision;
   * nonfinite observations throw and are reported at the operation boundary.
   */
  const fit: (interval: Interval) => C.IArc | undefined = (
    interval: Interval,
  ): C.IArc | undefined => {
    const points: C.Point[] = [];
    const first: C.Point = observe(interval.a, 1, "right");
    const last: C.Point = observe(interval.b, 1, "left");
    const firstNorm: number = Math.hypot(...first);
    const lastNorm: number = Math.hypot(...last);
    if (firstNorm === 0 || lastNorm === 0) return undefined;
    let curvatureSign: number = 0;
    for (let i: number = 0; i <= 32; ++i) {
      const t: number = interval.a + (interval.b - interval.a) * (i / 32);
      points.push(observe(t));
      if (i % 4 === 0) {
        const d1: C.Point = i === 0 ? first : i === 32 ? last : observe(t, 1);
        const d2: C.Point = observe(t, 2, i === 0 ? "right" : i === 32 ? "left" : undefined);
        const turn: number = C.cross(d1, d2);
        const endpoint: boolean = i === 0 || i === 32;
        const jerk: C.Point | undefined = endpoint ? observe(t, 3, i === 0 ? "right" : "left") : undefined;

        // A numerical critical root can leave a one-ulp parameter residual at
        // the endpoint. The jerk term bounds the resulting acceleration error,
        // including a large original parameter origin; source jets stay intact.
        const allowance: number = endpoint ? 128 * Number.EPSILON * Math.hypot(...d1) *
          (Math.hypot(...d2) + Math.max(Math.abs(t), curve.domain[1] - curve.domain[0]) * Math.hypot(...jerk!))
          : 64 * Number.EPSILON * (Math.abs(d1[0] * d2[1]) + Math.abs(d1[1] * d2[0]));
        if (Math.abs(turn) > allowance) {
          const sign: number = Math.sign(turn);
          if (curvatureSign !== 0 && sign !== curvatureSign) return undefined;
          curvatureSign = sign;
        }
      }
    }
    const p0: C.Point = points[0]!;
    const p2: C.Point = points[32]!;
    const chord: C.Point = minus(p2, p0);
    const chordSquared: number = chord[0] * chord[0] + chord[1] * chord[1];
    const length: number = Math.hypot(...chord);
    if (length === 0) return undefined;
    const determinant: number = C.cross(first, last);
    const relativeRoundoff: number = 64 * Number.EPSILON;

    // Parallel tangents admit a line only when the entire sampled chart and
    // both forward endpoint tangents are collinear to binary64 roundoff.
    if (Math.abs(determinant) <= relativeRoundoff * firstNorm * lastNorm) {
      const scale: number = Math.max(length, ...points.map((p: C.Point): number => C.distance(p, p0)));
      const allowance: number = relativeRoundoff * scale;
      if (
        first[0] * chord[0] + first[1] * chord[1] <= 0 ||
        last[0] * chord[0] + last[1] * chord[1] <= 0 ||
        Math.abs(C.cross(first, chord)) > relativeRoundoff * firstNorm * length ||
        Math.abs(C.cross(last, chord)) > relativeRoundoff * lastNorm * length
      ) return undefined;
      let previous: number = -Infinity;
      let maximum: number = 0;
      for (const p of points) {
        const offset: C.Point = minus(p, p0);
        const along: number = (offset[0] * chord[0] + offset[1] * chord[1]) / chordSquared;
        maximum = Math.max(maximum, Math.abs(C.cross(offset, chord)) / length);
        if (along < previous || along < 0 || along > 1 || maximum > allowance) return undefined;
        previous = along;
      }
      return {
        domain: [interval.a, interval.b],
        controls: [p0, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], p2],
        weight: 1,
        maximumSampleErrorMm: maximum,
      };
    }

    // Endpoint tangents must meet forward from the start and backward from
    // the end, otherwise positive-weight coefficients cannot follow the arc.
    const startScale: number = C.cross(chord, last) / determinant;
    const endScale: number = C.cross(chord, first) / determinant;
    if (startScale <= 0 || endScale >= 0) return undefined;
    const p1: C.Point = [p0[0] + startScale * first[0], p0[1] + startScale * first[1]];
    if (!p1.every(Number.isFinite)) return undefined;
    const side: C.Point = minus(p1, p0);
    const area: number = C.cross(side, chord);
    if (area === 0 || !Number.isFinite(area)) return undefined;
    const samples: Radial[] = [];
    let previousU: number = 0;
    for (let i: number = 1; i < 32; ++i) {
      const offset: C.Point = minus(points[i]!, p0);
      const b1: number = C.cross(offset, chord) / area;
      const b2: number = C.cross(side, offset) / area;
      const b0: number = 1 - b1 - b2;
      if (b0 <= 0 || b1 <= 0 || b2 <= 0) return undefined;
      const root0: number = Math.sqrt(b0);
      const root2: number = Math.sqrt(b2);
      const u: number = root2 / (root0 + root2);
      if (u <= previousU) return undefined;
      previousU = u;
      const base: C.Point = [
        (b0 * p0[0] + b2 * p2[0]) / (b0 + b2),
        (b0 * p0[1] + b2 * p2[1]) / (b0 + b2),
      ];
      const idealWeight: number = b1 / (2 * root0 * root2);
      if (!(idealWeight > 0) || !Number.isFinite(idealWeight)) return undefined;
      samples.push({ u, apex: b1, scale: C.distance(p1, base), idealWeight });
    }

    /** Signed distance along a fixed apex ray is monotone in positive weight. */
    const residual: (sample: Radial, weight: number) => number = (
      sample: Radial,
      weight: number,
    ): number => {
      const middle: number = 2 * weight * sample.u * (1 - sample.u);
      const denominator: number = (1 - sample.u) ** 2 + middle + sample.u ** 2;
      return (middle / denominator - sample.apex) * sample.scale;
    };
    const fitting: Radial[] = samples.filter((_sample: Radial, i: number): boolean => i % 2 === 1);
    let low: number = Math.min(...fitting.map((sample: Radial): number => Math.log(sample.idealWeight)));
    let high: number = Math.max(...fitting.map((sample: Radial): number => Math.log(sample.idealWeight)));
    for (let iteration: number = 0; iteration < 48 && low < high; ++iteration) {
      const middle: number = (low + high) / 2;
      const weight: number = Math.exp(middle);
      let minimum: number = 0;
      let maximum: number = 0;
      for (const sample of fitting) {
        const error: number = residual(sample, weight);
        minimum = Math.min(minimum, error);
        maximum = Math.max(maximum, error);
      }
      if (minimum + maximum > 0) high = middle;
      else low = middle;
    }
    const weight: number = Math.exp((low + high) / 2);
    const maximum: number = samples.reduce(
      (error: number, sample: Radial): number => Math.max(error, Math.abs(residual(sample, weight))),
      0,
    );
    if (!Number.isFinite(maximum) || !Number.isFinite(weight) || weight <= 0) return undefined;
    return {
      domain: [interval.a, interval.b],
      controls: [p0, p1, p2],
      weight,
      maximumSampleErrorMm: maximum,
    };
  };

  const boundaries: number[] = [curve.domain[0], ...new Set(curve.breaks), curve.domain[1]].sort((a: number, b: number): number => a - b);
  if (boundaries.length - 1 > options.maximumArcs) {
    diagnostics.push("The supplied source intervals already exceed maximumArcs.");
    return result("refused");
  }
  const pending: Interval[] = [];
  for (let i: number = boundaries.length - 2; i >= 0; --i)
    pending.push({ a: boundaries[i]!, b: boundaries[i + 1]!, depth: 0 });
  let leaves: number = pending.length;
  try {
    while (pending.length !== 0) {
      const interval: Interval = pending.pop()!;
      const arc: C.IArc | undefined = fit(interval);
      if (arc !== undefined && arc.maximumSampleErrorMm <= options.toleranceMm) {
        arcs.push(arc);
        continue;
      }
      const midpoint: number = (interval.a + interval.b) / 2;
      const reason: string = arc === undefined ? "inadmissible or nonregular tangent triangle" : "held-out radial discrepancy exceeds tolerance";
      if (interval.depth >= options.maximumDepth || leaves >= options.maximumArcs || midpoint === interval.a || midpoint === interval.b) {
        ++unresolved;
        reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
        continue;
      }
      ++leaves;
      pending.push({ a: midpoint, b: interval.b, depth: interval.depth + 1 });
      pending.push({ a: interval.a, b: midpoint, depth: interval.depth + 1 });
    }
  } catch (error) {
    diagnostics.push(error instanceof Error ? error.message : String(error));
    return result("refused");
  }
  for (const [reason, count] of reasons)
    diagnostics.push(`${count} unresolved source interval(s): ${reason}; subdivision budget exhausted.`);
  return result(unresolved === 0 ? "complete" : arcs.length === 0 ? "refused" : "partial");
}
