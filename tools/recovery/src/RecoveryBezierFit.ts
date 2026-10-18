import { AutoMovieBernstein64 as B } from "../../../packages/engine/src/geometry/curve/AutoMovieBernstein64.ts";
import { AutoMovieCurveMath64 as M } from "../../../packages/engine/src/geometry/curve/AutoMovieCurveMath64.ts";
import { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";

/** Shared engine vector arithmetic retains the physical coefficient chart. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  scale: typeof M.scale = M.scale;

/**
 * Fits physical ordered observations with adaptive tangent-constrained cubics.
 * Schneider's original Graphics Gems implementation is the algorithmic reference:
 * https://github.com/erich666/GraphicsGems/blob/master/gems/FitCurves.c .
 *
 * @evidence contracts/common.md#principled-implementation Schneider's two-handle least squares is extended to three coordinates; Bernstein restriction bounds the matched input polyline between observations.
 * @evidence contracts/common.md#clear-and-simple-design One stateless namespace owns fitting and its input/output records; existing engine Bernstein operations own evaluation and restriction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-specific coordinates or edge-per-span representation is assumed; callers receive span count and unresolved tolerance explicitly.
 * @evidence contracts/common.md#meaningful-documentation States physical millimetres, declared corners, G1 versus C1 and the finite-polyline scope of the bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization performs no fitting; fit documents its cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cross-request owner exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No state or handles survive a call.
 */
export namespace RecoveryBezierFit {
  /**
   * Ordered observations in one physical millimetre chart.
   *
   * @evidence contracts/common.md#principled-implementation A sequence, explicit corner indices and physical tolerance define the approximation problem without a source mesh dependency.
   * @evidence contracts/common.md#clear-and-simple-design The caller owns feature semantics; numerical fitting owns only admitted point order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No inferred smoothing removes source observations.
   * @evidence contracts/common.md#meaningful-documentation Properties state closure, units, budgets and parameterization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns immutable inputs during one fit.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record owns no resources.
   * @author Samchon
   */
  export interface Input {
    /** Semantic curve name carried into engine construction. */
    name: string;
    /** Ordered millimetre points; closed paths omit the repeated endpoint. */
    pointsMm: readonly C.Vector[];
    /** Whether the last point joins the first. */
    closed: boolean;
    /** Declared C0 corners; other adaptive joins share a tangent direction. */
    corners: readonly number[];
    /** Positive requested finite-polyline correspondence tolerance, millimetres. */
    toleranceMm: number;
    /** Hard output budget; exhaustion throws rather than losing observations. */
    maxSpans: number;
    /** Chord length is physical; centripetal uses square-root chord weights. */
    parameterization: "chord" | "centripetal";
  }

  /**
   * Complete curve coefficients and honest finite-observation error accounting.
   *
   * @evidence contracts/common.md#principled-implementation Each accepted span retains the maximum correspondence sample residual and convex-hull upper estimate over all matched polyline intervals.
   * @evidence contracts/common.md#clear-and-simple-design One coefficient authority accompanies aggregate diagnostics rather than a duplicate display curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Binary64 convex-hull estimates are not outward-rounded certificates or bounds against the unknown continuous source surface.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes sample residual, polyline bound, compactness and unresolved tolerance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A result record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same curve is consumed by reconstruction and construction inspection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns coefficient arrays and diagnostics; the fitter retains nothing.
   * @author Samchon
   */
  export interface Result {
    /** Actual fitted coefficients, physical widths and shared endpoints. */
    curve: C.Cubic;
    /** Largest observed point-to-corresponding-parameter residual, millimetres. */
    sampleMaximumMm: number;
    /** Bernstein convex-hull upper estimate over the full input polyline, millimetres. */
    polylineUpperEstimateMm: number;
    /** False means a two-observation tangent-constrained span could not meet tolerance. */
    toleranceMet: boolean;
    /** Observation count divided by span count; no universal compactness threshold is implied. */
    observationsPerSpan: number;
    /** Number of attempted solves using the declared conditioning or handle-sign fallback. */
    handleFallbacks: number;
  }

  /**
   * Solve endpoint handle lengths, refine monotone parameters and split the worst interval.
   * Smooth adaptive joins are G1; physical phase widths do not enforce equal derivative magnitude.
   * Declared corners retain independent one-sided tangents. Repeated adjacent points reject.
   * An optional observer receives accepted span-local parameters and private input-point
   * ranges without changing coefficients or adding source addresses to the result.
   *
   * @evidence contracts/common.md#principled-implementation Physical-arclength-weighted two-by-two normal equations solve positive handle distances along fixed endpoint tangents; four safeguarded Newton updates improve correspondence before adaptive splitting. Closed input starts with two arcs, and coincident arc endpoints receive the same adaptive error assessment.
   * @evidence contracts/common.md#clear-and-simple-design An explicit work stack avoids recursive call-stack growth; local closures share the admitted point chart and output budgets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No corner is invented, no observation is dropped and unsatisfied terminal spans remain marked. A singular or negative handle solution falls back to one-third chord handles and is subjected to the same error calculation.
   * @evidence contracts/common.md#meaningful-documentation Names the algorithm, tangent continuity, millimetre errors, fallback and finite-polyline limitation.
   * @evidence contracts/performance.md#efficient-algorithms For N observations and S spans, balanced splits cost O(N log S), worst-case O(N squared), with constant four Newton rounds per candidate and O(N+S) live storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Each candidate reuses its parameters, derivative nets and endpoint tangents across evaluation; there is no mutable-input cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The work stack and observation copies expire on return or throw; only S coefficient spans and scalar diagnostics escape.
   */
  export function fit(
    input: Input,
    observeCorrespondence?: (
      span: number,
      first: number,
      last: number,
      parameters: readonly number[],
    ) => void,
  ): Result {
    const source: B.Vec[] = input.pointsMm.map((p: C.Vector): B.Vec => [...p]);
    const n: number = source.length;
    if (
      n < (input.closed ? 3 : 2) ||
      !source.every(
        (p: B.Vec): boolean => p.length === 3 && p.every(Number.isFinite),
      )
    )
      throw new Error("Fitting needs finite ordered physical observations");
    if (
      !(input.toleranceMm > 0) ||
      !Number.isFinite(input.toleranceMm) ||
      !Number.isSafeInteger(input.maxSpans) ||
      input.maxSpans < 1
    )
      throw new Error(
        "Fitting needs a positive tolerance and integer span budget",
      );
    if (
      input.parameterization !== "chord" &&
      input.parameterization !== "centripetal"
    )
      throw new Error("Unknown fitting parameterization");
    const points: B.Vec[] = input.closed ? [...source, source[0]!] : source;
    const cumulative: number[] = [0];
    for (let i: number = 1; i < points.length; i++) {
      const length: number = distance(points[i - 1]!, points[i]!);
      const total: number = cumulative[i - 1]! + length;
      if (
        !(length > 0) ||
        !Number.isFinite(total) ||
        total <= cumulative[i - 1]!
      )
        throw new Error(
          "Adjacent observations collapse or physical length is unresolved",
        );
      cumulative.push(total);
    }
    const knots: Set<number> = new Set([0, points.length - 1]);
    for (const corner of input.corners) {
      if (!Number.isSafeInteger(corner) || corner < 0 || corner >= n)
        throw new Error("Corner index does not address an observation");
      knots.add(corner);
    }
    if (input.closed && knots.size === 2) {
      const half: number = cumulative[cumulative.length - 1]! / 2;
      let split: number = 1;
      while (split < n - 1 && cumulative[split]! < half) split++;
      knots.add(split);
    }
    const ordered: number[] = [...knots].sort(
      (a: number, b: number): number => a - b,
    );
    const declared: Set<number> = new Set(input.corners);
    const spans: C.Span[] = [];
    const widths: number[] = [];
    let sampleMaximumMm: number = 0,
      polylineUpperEstimateMm: number = 0;
    let handleFallbacks: number = 0;
    const tangent = (at: number): B.Vec => {
      if (!input.closed && at === 0) return unit(sub(points[1]!, points[0]!));
      if (!input.closed && at === n - 1)
        return unit(sub(points[n - 1]!, points[n - 2]!));
      return unit(sub(source[(at + 1) % n]!, source[(at + n - 1) % n]!));
    };
    const work: { first: number; last: number; left: B.Vec; right: B.Vec }[] =
      [];
    for (let k: number = ordered.length - 2; k >= 0; k--) {
      const first: number = ordered[k]!,
        last: number = ordered[k + 1]!;
      work.push({
        first,
        last,
        left: declared.has(first % n)
          ? unit(sub(points[first + 1]!, points[first]!))
          : tangent(first),
        right: declared.has(last % n)
          ? unit(sub(points[last - 1]!, points[last]!))
          : scale(tangent(last % n), -1),
      });
    }
    while (work.length > 0) {
      if (spans.length + work.length > input.maxSpans)
        throw new Error("Fitted span budget exhausted");
      const job: (typeof work)[number] = work.pop()!;
      const p: B.Vec[] = points.slice(job.first, job.last + 1);
      const u: number[] = [0];
      for (let i: number = 1; i < p.length; i++)
        u.push(
          u[i - 1]! +
            distance(p[i - 1]!, p[i]!) **
              (input.parameterization === "chord" ? 1 : 0.5),
        );
      const total: number = u[u.length - 1]!;
      for (let i: number = 1; i < u.length; i++) u[i] = u[i]! / total;
      if (
        !u.every(
          (x: number, i: number): boolean =>
            Number.isFinite(x) && (i === 0 || x > u[i - 1]!),
        )
      )
        throw new Error("Fitting parameter intervals are not representable");
      const arc: number = cumulative[job.last]! - cumulative[job.first]!;
      const weights: number[] = p.map(
        (point: B.Vec, i: number): number =>
          ((i > 0 ? distance(point, p[i - 1]!) : 0) +
            (i + 1 < p.length ? distance(point, p[i + 1]!) : 0)) /
          (2 * arc),
      );
      const solved: ReturnType<typeof solve> = solve(
        p,
        u,
        weights,
        job.left,
        job.right,
      );
      let controls: B.Poly = solved.controls;
      if (solved.fallback) handleFallbacks++;
      let errors: { sample: number; bound: number; split: number } = error(
        p,
        u,
        controls,
      );
      for (
        let round: number = 0;
        round < 4 && errors.bound > input.toleranceMm;
        round++
      ) {
        const d: B.Poly = B.tangent(controls),
          dd: B.Poly = B.tangent(d);
        const next: number[] = u.slice();
        for (let i: number = 1; i < u.length - 1; i++) {
          const q: B.Vec = sub(B.value(controls, u[i]!), p[i]!);
          const v: B.Vec = B.value(d, u[i]!),
            a: B.Vec = B.value(dd, u[i]!);
          const denominator: number = dot(v, v) + dot(q, a);
          const candidate: number = u[i]! - dot(q, v) / denominator;
          if (
            Number.isFinite(candidate) &&
            candidate > u[i - 1]! &&
            candidate < u[i + 1]!
          )
            next[i] = candidate;
        }
        if (
          !next.every(
            (x: number, i: number): boolean => i === 0 || x > next[i - 1]!,
          )
        )
          break;
        const attempted: ReturnType<typeof solve> = solve(
          p,
          next,
          weights,
          job.left,
          job.right,
        );
        const candidate: B.Poly = attempted.controls;
        if (attempted.fallback) handleFallbacks++;
        const candidateError: typeof errors = error(p, next, candidate);
        if (candidateError.bound >= errors.bound) break;
        for (let i: number = 0; i < u.length; i++) u[i] = next[i]!;
        controls = candidate;
        errors = candidateError;
      }
      if (errors.bound <= input.toleranceMm || p.length === 2) {
        observeCorrespondence?.(spans.length, job.first, job.last, u.slice());
        spans.push(controls as unknown as C.Span);
        widths.push(cumulative[job.last]! - cumulative[job.first]!);
        sampleMaximumMm = Math.max(sampleMaximumMm, errors.sample);
        polylineUpperEstimateMm = Math.max(
          polylineUpperEstimateMm,
          errors.bound,
        );
      } else {
        const split: number =
          job.first + Math.max(1, Math.min(p.length - 2, errors.split));
        let center: B.Vec = sub(points[split + 1]!, points[split - 1]!);
        if (Math.hypot(...center) === 0)
          center = sub(points[split]!, points[split - 1]!);
        center = unit(center);
        work.push({
          first: split,
          last: job.last,
          left: center,
          right: job.right,
        });
        work.push({
          first: job.first,
          last: split,
          left: job.left,
          right: scale(center, -1),
        });
      }
    }
    return {
      curve: {
        type: "cubicBezier",
        name: input.name,
        closed: input.closed,
        unit: "mm",
        phaseUnit: "mm",
        phaseIntervals: widths,
        spans,
      },
      sampleMaximumMm,
      polylineUpperEstimateMm,
      toleranceMet: polylineUpperEstimateMm <= input.toleranceMm,
      observationsPerSpan: n / spans.length,
      handleFallbacks,
    };
  }

  /**
   * Solve arclength-weighted two-handle normal equations in the physical chart.
   *
   */
  function solve(
    p: B.Vec[],
    u: number[],
    weights: number[],
    left: B.Vec,
    right: B.Vec,
  ): { controls: B.Poly; fallback: boolean } {
    const start: B.Vec = p[0]!,
      end: B.Vec = p[p.length - 1]!;
    let aa: number = 0,
      ab: number = 0,
      bb: number = 0,
      ax: number = 0,
      bx: number = 0;
    for (let i: number = 0; i < p.length; i++) {
      const t: number = u[i]!,
        s: number = 1 - t;
      const a: B.Vec = scale(left, 3 * t * s * s),
        b: B.Vec = scale(right, 3 * t * t * s);
      const residual: B.Vec = sub(
        p[i]!,
        add(
          scale(start, s * s * s + 3 * t * s * s),
          scale(end, t * t * t + 3 * t * t * s),
        ),
      );
      const weight: number = weights[i]!;
      aa += weight * dot(a, a);
      ab += weight * dot(a, b);
      bb += weight * dot(b, b);
      ax += weight * dot(a, residual);
      bx += weight * dot(b, residual);
    }
    const determinant: number = aa * bb - ab * ab;
    let alpha: number = (ax * bb - bx * ab) / determinant,
      beta: number = (bx * aa - ax * ab) / determinant;
    const fallback: boolean =
      !(determinant > 64 * Number.EPSILON * aa * bb) ||
      !(alpha > 0 && beta > 0) ||
      !Number.isFinite(alpha + beta);
    if (fallback) {
      alpha = distance(start, end) / 3;
      beta = alpha;
    }
    return {
      controls: [
        start,
        add(start, scale(left, alpha)),
        add(end, scale(right, beta)),
        end,
      ],
      fallback,
    };
  }

  /**
   * Restrict each matched chord interval and bound its elevated polynomial difference.
   *
   */
  function error(
    p: B.Vec[],
    u: number[],
    controls: B.Poly,
  ): { sample: number; bound: number; split: number } {
    let sample: number = 0,
      bound: number = 0,
      split: number = Math.floor(p.length / 2);
    for (let i: number = 0; i < p.length; i++)
      sample = Math.max(sample, distance(p[i]!, B.value(controls, u[i]!)));
    for (let i: number = 0; i < p.length - 1; i++) {
      const restricted: B.Poly = B.restrict(controls, u[i]!, u[i + 1]!);
      const chord: B.Poly = B.elevate([p[i]!, p[i + 1]!], 3);
      const estimate: number = Math.max(
        ...restricted.map((v: B.Vec, j: number): number =>
          distance(v, chord[j]!),
        ),
      );
      if (estimate > bound) {
        bound = estimate;
        split = i + 1;
      }
    }
    if (!Number.isFinite(sample + bound))
      throw new Error("Curve fitting arithmetic is unresolved");
    return { sample, bound, split };
  }
  /**
   * Dot product for the physical least-squares and Newton equations.
   *
   */
  function dot(a: B.Vec, b: B.Vec): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  /**
   * Euclidean point distance in millimetres.
   *
   */
  function distance(a: B.Vec, b: B.Vec): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
  /**
   * Normalize a measurable tangent without inventing a direction at degeneracy.
   *
   */
  function unit(a: B.Vec): B.Vec {
    const length: number = Math.hypot(...a);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error("Observation tangent is unresolved");
    return scale(a, 1 / length);
  }
}
