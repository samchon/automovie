import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";

import { AutoMovieRecoveryConicApproximation as C } from "../AutoMovieRecoveryConicApproximation";

/*
 * Construct G1 bitangent conics using Ahn's control-triangle subdivision
 * scheme.
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
 * admit an explicit collinear quadratic, the conic's degenerate case: exactly
 * collinear to roundoff, or, where the control triangle refuses a chart whose
 * curvature keeps its sign, when its samples advance along its chord within
 * toleranceMm of it (a bend below its coordinates' roundoff, between close
 * inflections, refused at every depth otherwise). Such a primitive's end
 * tangents are its chord's, so G1 holds there only to that tolerance's bend.
 * Source callbacks are borrowed and must be deterministic; callback failures or
 * nonfinite data refuse the whole call. Incident endpoint jets request exact
 * right/left limits so supplied breaks preserve genuine source corners without
 * finite-difference displacements.
 */
export function approximateRecoveryConicsAhn(
  curve: IAutoMoviePlanarCurveSource,
  options: IAutoMovieConicApproximation.IOptions,
): IAutoMovieConicApproximation.IResult {
  const method: string =
    "Ahn 2001 triangle construction / sampled radial-minimax adaptation";
  const diagnostics: string[] = C.validate(curve, options);
  const arcs: IAutoMovieRegisteredConicArc[] = [];
  let queries: number = 0;
  let unresolved: number = 0;
  const reasons: Map<string, number> = new Map();

  /*
   * Assemble evidence without retaining callback closures or observed samples.
   */
  function result(
    status: IAutoMovieConicApproximation.IResult["status"],
  ): IAutoMovieConicApproximation.IResult {
    if (status === "refused")
      return {
        method,
        status,
        arcs: [],
        diagnostics,
        maximumSampleErrorMm: 0,
        certified: false,
        queries,
      };
    return {
      method,
      status,
      arcs,
      diagnostics,
      maximumSampleErrorMm: arcs.reduce(
        (maximum: number, arc: IAutoMovieRegisteredConicArc): number =>
          Math.max(maximum, arc.maximumSampleErrorMm),
        0,
      ),
      certified: false,
      queries,
    };
  }
  if (diagnostics.length !== 0) return result("refused");
  diagnostics.push(
    "Numerical adaptation: Ahn's full characterization theorem/error function was unavailable; radial-correspondence samples do not certify Hausdorff distance or global minimality.",
  );

  /*
   * Reject corrupt observations rather than creating substitute coordinates.
   */
  const observe: (
    t: number,
    order?: 1 | 2 | 3,
    side?: "left" | "right",
  ) => Readonly<AutoMovieVector2Tuple> = (
    t: number,
    order?: 1 | 2 | 3,
    side?: "left" | "right",
  ): Readonly<AutoMovieVector2Tuple> => {
    ++queries;
    const p: Readonly<AutoMovieVector2Tuple> =
      order === undefined
        ? curve.evaluate(t)
        : curve.derivative(t, order, side);
    if (p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))
      throw new Error(
        `Nonfinite source ${order === undefined ? "point" : "derivative"} at parameter ${t}.`,
      );
    // A source evaluator may reuse a scratch tuple. Snapshot the value now so
    // later source queries cannot change observed points or returned controls.
    return [p[0], p[1]];
  };

  /*
   * Source-minus-origin vectors keep determinants translation invariant.
   */
  const minus: (
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ) => Readonly<AutoMovieVector2Tuple> = (
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ): Readonly<AutoMovieVector2Tuple> => [a[0] - b[0], a[1] - b[1]];

  /*
   * A work item retains only source interval, subdivision depth and its cause.
   */
  interface Interval {
    a: number;
    b: number;
    depth: number;
  }

  /*
   * A radial correspondence needs no nearest-point solve during weight search.
   */
  interface Radial {
    u: number;
    apex: number;
    scale: number;
    idealWeight: number;
  }

  /*
   * Attempt one admissible triangle. Undefined requests source subdivision;
   * nonfinite observations throw and are reported at the operation boundary.
   */
  const fit: (
    interval: Interval,
  ) => IAutoMovieRegisteredConicArc | undefined = (
    interval: Interval,
  ): IAutoMovieRegisteredConicArc | undefined => {
    const points: Readonly<AutoMovieVector2Tuple>[] = [];
    const first: Readonly<AutoMovieVector2Tuple> = observe(
      interval.a,
      1,
      "right",
    );
    const last: Readonly<AutoMovieVector2Tuple> = observe(
      interval.b,
      1,
      "left",
    );
    const firstNorm: number = Math.hypot(...first);
    const lastNorm: number = Math.hypot(...last);
    if (firstNorm === 0 || lastNorm === 0) return undefined;
    let curvatureSign: number = 0;
    for (let i: number = 0; i <= 32; ++i) {
      const t: number = interval.a + (interval.b - interval.a) * (i / 32);
      points.push(observe(t));
      if (i % 4 === 0) {
        const d1: Readonly<AutoMovieVector2Tuple> =
          i === 0 ? first : i === 32 ? last : observe(t, 1);
        const d2: Readonly<AutoMovieVector2Tuple> = observe(
          t,
          2,
          i === 0 ? "right" : i === 32 ? "left" : undefined,
        );
        const turn: number = C.cross(d1, d2);
        const endpoint: boolean = i === 0 || i === 32;
        const jerk: Readonly<AutoMovieVector2Tuple> | undefined = endpoint
          ? observe(t, 3, i === 0 ? "right" : "left")
          : undefined;

        // A numerical critical root can leave a one-ulp parameter residual at
        // the endpoint. The jerk term bounds the resulting acceleration error,
        // including a large original parameter origin; source jets stay intact.
        const allowance: number = endpoint
          ? 128 *
            Number.EPSILON *
            Math.hypot(...d1) *
            (Math.hypot(...d2) +
              Math.max(Math.abs(t), curve.domain.end - curve.domain.start) *
                Math.hypot(...jerk!))
          : 64 *
            Number.EPSILON *
            (Math.abs(d1[0] * d2[1]) + Math.abs(d1[1] * d2[0]));
        if (Math.abs(turn) > allowance) {
          const sign: number = Math.sign(turn);
          if (curvatureSign !== 0 && sign !== curvatureSign) return undefined;
          curvatureSign = sign;
        }
      }
    }
    const p0: Readonly<AutoMovieVector2Tuple> = points[0]!;
    const p2: Readonly<AutoMovieVector2Tuple> = points[32]!;
    const chord: Readonly<AutoMovieVector2Tuple> = minus(p2, p0);
    const chordSquared: number = chord[0] * chord[0] + chord[1] * chord[1];
    const length: number = Math.hypot(...chord);
    if (length === 0) return undefined;
    const determinant: number = C.cross(first, last);
    const relativeRoundoff: number = 64 * Number.EPSILON;

    // A conic's degenerate case, the line, within the caller's tolerance:
    // the chart is admitted as the collinear primitive when both endpoint
    // tangents point forward along its chord, its samples advance along the
    // chord, and each lies within toleranceMm of it. It is tried only where
    // the conic construction refuses, so no conic admitted otherwise changes.
    // A chart that bends by less than its coordinates' roundoff, such as a
    // near-flat stretch between two close inflections far from the origin,
    // has samples either side of its chord by roundoff, outside every control
    // triangle at every depth, while its end tangents still differ by more
    // than roundoff; without this it was refused and bisected until the arc
    // budget ran out. The primitive's end tangents are the chord's: they
    // differ from the source's by its bend, which the tolerance bounds through
    // the samples' distance from the chord, not by an angle.
    const straight: () => IAutoMovieRegisteredConicArc | undefined = ():
      | IAutoMovieRegisteredConicArc
      | undefined => {
      if (
        first[0] * chord[0] + first[1] * chord[1] <= 0 ||
        last[0] * chord[0] + last[1] * chord[1] <= 0
      )
        return undefined;
      let previous: number = -Infinity;
      let maximum: number = 0;
      for (const p of points) {
        const offset: Readonly<AutoMovieVector2Tuple> = minus(p, p0);
        const along: number =
          (offset[0] * chord[0] + offset[1] * chord[1]) / chordSquared;
        maximum = Math.max(maximum, Math.abs(C.cross(offset, chord)) / length);
        if (
          along < previous ||
          along < 0 ||
          along > 1 ||
          maximum > options.toleranceMm
        )
          return undefined;
        previous = along;
      }
      return {
        domain: [interval.a, interval.b],
        controls: [p0, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], p2],
        weight: 1,
        maximumSampleErrorMm: maximum,
      };
    };

    // Parallel tangents admit a line only when the entire sampled chart and
    // both forward endpoint tangents are collinear to binary64 roundoff, or
    // within the tolerance of its chord (`straight`).
    if (Math.abs(determinant) <= relativeRoundoff * firstNorm * lastNorm) {
      const scale: number = Math.max(
        length,
        ...points.map((p: Readonly<AutoMovieVector2Tuple>): number =>
          C.distance(p, p0),
        ),
      );
      const allowance: number = relativeRoundoff * scale;
      if (
        first[0] * chord[0] + first[1] * chord[1] <= 0 ||
        last[0] * chord[0] + last[1] * chord[1] <= 0 ||
        Math.abs(C.cross(first, chord)) >
          relativeRoundoff * firstNorm * length ||
        Math.abs(C.cross(last, chord)) > relativeRoundoff * lastNorm * length
      )
        return straight();
      let previous: number = -Infinity;
      let maximum: number = 0;
      for (const p of points) {
        const offset: Readonly<AutoMovieVector2Tuple> = minus(p, p0);
        const along: number =
          (offset[0] * chord[0] + offset[1] * chord[1]) / chordSquared;
        maximum = Math.max(maximum, Math.abs(C.cross(offset, chord)) / length);
        if (along < previous || along < 0 || along > 1 || maximum > allowance)
          return straight();
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
    if (startScale <= 0 || endScale >= 0) return straight();
    const p1: Readonly<AutoMovieVector2Tuple> = [
      p0[0] + startScale * first[0],
      p0[1] + startScale * first[1],
    ];
    if (
      p1.some(
        (value: number): boolean => value === Infinity || value === -Infinity,
      )
    )
      return straight();
    const side: Readonly<AutoMovieVector2Tuple> = minus(p1, p0);
    const area: number = C.cross(side, chord);
    if (area === 0 || area === Infinity || area === -Infinity)
      return straight();
    const samples: Radial[] = [];
    let previousU: number = 0;
    for (let i: number = 1; i < 32; ++i) {
      const offset: Readonly<AutoMovieVector2Tuple> = minus(points[i]!, p0);
      const b1: number = C.cross(offset, chord) / area;
      const b2: number = C.cross(side, offset) / area;
      const b0: number = 1 - b1 - b2;
      if (b0 <= 0 || b1 <= 0 || b2 <= 0) return straight();
      const root0: number = Math.sqrt(b0);
      const root2: number = Math.sqrt(b2);
      const u: number = root2 / (root0 + root2);
      if (u <= previousU) return straight();
      previousU = u;
      const base: Readonly<AutoMovieVector2Tuple> = [
        (b0 * p0[0] + b2 * p2[0]) / (b0 + b2),
        (b0 * p0[1] + b2 * p2[1]) / (b0 + b2),
      ];
      const idealWeight: number = b1 / (2 * root0 * root2);
      if (root0 === 0 || root2 === 0 || !(idealWeight > 0)) return straight();
      samples.push({ u, apex: b1, scale: C.distance(p1, base), idealWeight });
    }

    /*
     * Signed distance along a fixed apex ray is monotone in positive weight.
     */
    const residual: (sample: Radial, weight: number) => number = (
      sample: Radial,
      weight: number,
    ): number => {
      const middle: number = 2 * weight * sample.u * (1 - sample.u);
      const denominator: number = (1 - sample.u) ** 2 + middle + sample.u ** 2;
      return (middle / denominator - sample.apex) * sample.scale;
    };
    const fitting: Radial[] = samples.filter(
      (_sample: Radial, i: number): boolean => i % 2 === 1,
    );
    let low: number = Math.min(
      ...fitting.map((sample: Radial): number => Math.log(sample.idealWeight)),
    );
    let high: number = Math.max(
      ...fitting.map((sample: Radial): number => Math.log(sample.idealWeight)),
    );
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
      (error: number, sample: Radial): number =>
        Math.max(error, Math.abs(residual(sample, weight))),
      0,
    );
    if (weight <= 0) return straight();
    return {
      domain: [interval.a, interval.b],
      controls: [p0, p1, p2],
      weight,
      maximumSampleErrorMm: maximum,
    };
  };

  const boundaries: number[] = [
    curve.domain.start,
    ...new Set(curve.breaks),
    curve.domain.end,
  ].sort((a: number, b: number): number => a - b);
  if (boundaries.length - 1 > options.maximumArcs) {
    diagnostics.push(
      "The supplied source intervals already exceed maximumArcs.",
    );
    return result("refused");
  }
  const pending: Interval[] = [];
  for (let i: number = boundaries.length - 2; i >= 0; --i)
    pending.push({ a: boundaries[i]!, b: boundaries[i + 1]!, depth: 0 });
  let leaves: number = pending.length;
  try {
    while (pending.length !== 0) {
      const interval: Interval = pending.pop()!;
      const arc: IAutoMovieRegisteredConicArc | undefined = fit(interval);
      if (
        arc !== undefined &&
        arc.maximumSampleErrorMm <= options.toleranceMm
      ) {
        arcs.push(arc);
        continue;
      }
      const midpoint: number = (interval.a + interval.b) / 2;
      const reason: string =
        arc === undefined
          ? "inadmissible or nonregular tangent triangle"
          : "held-out radial discrepancy exceeds tolerance";
      if (
        interval.depth >= options.maximumDepth ||
        leaves >= options.maximumArcs ||
        midpoint === interval.a ||
        midpoint === interval.b
      ) {
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
    diagnostics.push(
      `${count} unresolved source interval(s): ${reason}; subdivision budget exhausted.`,
    );
  return result(
    unresolved === 0 ? "complete" : arcs.length === 0 ? "refused" : "partial",
  );
}
