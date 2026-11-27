import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";
import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMoviePolylineFit,
  IAutoMoviePolylineFitInput,
} from "@automovie/interface";

/*
 * Shared engine vector arithmetic retains the physical coefficient chart.
 */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  scale: typeof M.scale = M.scale;

/**
 * Fits physical ordered observations with adaptive tangent-constrained cubics.
 * Schneider's original Graphics Gems implementation is the algorithmic
 * reference:
 * https://github.com/erich666/GraphicsGems/blob/master/gems/FitCurves.c .
 */
export namespace RecoveryBezierFit {
  /**
   * Solve endpoint handle lengths, refine monotone parameters and split the
   * worst interval. Smooth adaptive joins are G1; physical phase widths do not
   * enforce equal derivative magnitude. Declared corners retain independent
   * one-sided tangents. Repeated adjacent points reject. An optional observer
   * receives accepted span-local parameters and private input-point ranges
   * without changing coefficients or adding source addresses to the result.
   */
  export function fit(
    input: IAutoMoviePolylineFitInput,
    observeCorrespondence?: (
      span: number,
      first: number,
      last: number,
      parameters: readonly number[],
    ) => void,
  ): IAutoMoviePolylineFit {
    const source: AutoMovieVector3Tuple[] = input.pointsMm.map(
      (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => [...p],
    );
    const n: number = source.length;
    if (
      n < (input.closed ? 3 : 2) ||
      !source.every((p: AutoMovieVector3Tuple): boolean => p.length === 3)
    )
      throw new Error("Fitting needs finite ordered physical observations");
    if (!(input.toleranceMm > 0) || input.maxSpans < 1)
      throw new Error(
        "Fitting needs a positive tolerance and integer span budget",
      );
    if (
      input.parameterization !== "chord" &&
      input.parameterization !== "centripetal"
    )
      throw new Error("Unknown fitting parameterization");
    const points: AutoMovieVector3Tuple[] = input.closed
      ? [...source, source[0]!]
      : source;
    const cumulative: number[] = [0];
    for (let i: number = 1; i < points.length; i++) {
      const length: number = distance(points[i - 1]!, points[i]!);
      const total: number = cumulative[i - 1]! + length;
      if (!(length > 0) || total === Infinity || total <= cumulative[i - 1]!)
        throw new Error(
          "Adjacent observations collapse or physical length is unresolved",
        );
      cumulative.push(total);
    }
    const knots: Set<number> = new Set([0, points.length - 1]);
    for (const corner of input.corners) {
      if (corner < 0 || corner >= n)
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
    const spans: AutoMovieCubicBezierControls3[] = [];
    const widths: number[] = [];
    let sampleMaximumMm: number = 0,
      polylineUpperEstimateMm: number = 0;
    let handleFallbacks: number = 0;
    const tangent: (at: number) => AutoMovieVector3Tuple = (
      at: number,
    ): AutoMovieVector3Tuple => {
      if (!input.closed && at === 0) return unit(sub(points[1]!, points[0]!));
      if (!input.closed && at === n - 1)
        return unit(sub(points[n - 1]!, points[n - 2]!));
      return unit(sub(source[(at + 1) % n]!, source[(at + n - 1) % n]!));
    };
    const work: {
      first: number;
      last: number;
      left: AutoMovieVector3Tuple;
      right: AutoMovieVector3Tuple;
    }[] = [];
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
      const p: AutoMovieVector3Tuple[] = points.slice(job.first, job.last + 1);
      const u: number[] = [0];
      for (let i: number = 1; i < p.length; i++)
        u.push(
          u[i - 1]! +
            distance(p[i - 1]!, p[i]!) **
              (input.parameterization === "chord" ? 1 : 0.5),
        );
      const total: number = u[u.length - 1]!;
      for (let i: number = 1; i < u.length; i++) u[i] = u[i]! / total;
      if (!u.every((x: number, i: number): boolean => i === 0 || x > u[i - 1]!))
        throw new Error("Fitting parameter intervals are not representable");
      const arc: number = cumulative[job.last]! - cumulative[job.first]!;
      const weights: number[] = p.map(
        (point: AutoMovieVector3Tuple, i: number): number =>
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
      let controls: AutoMovieBernsteinPolynomial64 = solved.controls;
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
        const d: AutoMovieBernsteinPolynomial64 = B.tangent(controls),
          dd: AutoMovieBernsteinPolynomial64 = B.tangent(d);
        const next: number[] = u.slice();
        for (let i: number = 1; i < u.length - 1; i++) {
          const q: AutoMovieVector3Tuple = sub(B.value(controls, u[i]!), p[i]!);
          const v: AutoMovieVector3Tuple = B.value(d, u[i]!),
            a: AutoMovieVector3Tuple = B.value(dd, u[i]!);
          const denominator: number = dot(v, v) + dot(q, a);
          const candidate: number = u[i]! - dot(q, v) / denominator;
          if (candidate > u[i - 1]! && candidate < u[i + 1]!)
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
        const candidate: AutoMovieBernsteinPolynomial64 = attempted.controls;
        if (attempted.fallback) handleFallbacks++;
        const candidateError: typeof errors = error(p, next, candidate);
        if (candidateError.bound >= errors.bound) break;
        for (let i: number = 0; i < u.length; i++) u[i] = next[i]!;
        controls = candidate;
        errors = candidateError;
      }
      if (errors.bound <= input.toleranceMm || p.length === 2) {
        observeCorrespondence?.(spans.length, job.first, job.last, u.slice());
        // A cubic fit carries exactly four Bernstein controls.
        spans.push([controls[0]!, controls[1]!, controls[2]!, controls[3]!]);
        widths.push(cumulative[job.last]! - cumulative[job.first]!);
        sampleMaximumMm = Math.max(sampleMaximumMm, errors.sample);
        polylineUpperEstimateMm = Math.max(
          polylineUpperEstimateMm,
          errors.bound,
        );
      } else {
        const split: number =
          job.first + Math.max(1, Math.min(p.length - 2, errors.split));
        let center: AutoMovieVector3Tuple = sub(
          points[split + 1]!,
          points[split - 1]!,
        );
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

  /*
   * Solve arclength-weighted two-handle normal equations in the physical chart.
   */
  function solve(
    p: AutoMovieVector3Tuple[],
    u: number[],
    weights: number[],
    left: AutoMovieVector3Tuple,
    right: AutoMovieVector3Tuple,
  ): { controls: AutoMovieBernsteinPolynomial64; fallback: boolean } {
    const start: AutoMovieVector3Tuple = p[0]!,
      end: AutoMovieVector3Tuple = p[p.length - 1]!;
    let aa: number = 0,
      ab: number = 0,
      bb: number = 0,
      ax: number = 0,
      bx: number = 0;
    for (let i: number = 0; i < p.length; i++) {
      const t: number = u[i]!,
        s: number = 1 - t;
      const a: AutoMovieVector3Tuple = scale(left, 3 * t * s * s),
        b: AutoMovieVector3Tuple = scale(right, 3 * t * t * s);
      const residual: AutoMovieVector3Tuple = sub(
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
      alpha + beta === Infinity;
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

  /*
   * Restrict each matched chord interval and bound its elevated polynomial
   * difference.
   */
  function error(
    p: AutoMovieVector3Tuple[],
    u: number[],
    controls: AutoMovieBernsteinPolynomial64,
  ): { sample: number; bound: number; split: number } {
    let sample: number = 0,
      bound: number = 0,
      split: number = Math.floor(p.length / 2);
    for (let i: number = 0; i < p.length; i++)
      sample = Math.max(sample, distance(p[i]!, B.value(controls, u[i]!)));
    for (let i: number = 0; i < p.length - 1; i++) {
      const restricted: AutoMovieBernsteinPolynomial64 = B.restrict(
        controls,
        u[i]!,
        u[i + 1]!,
      );
      const chord: AutoMovieBernsteinPolynomial64 = B.elevate(
        [p[i]!, p[i + 1]!],
        3,
      );
      const estimate: number = Math.max(
        ...restricted.map((v: AutoMovieVector3Tuple, j: number): number =>
          distance(v, chord[j]!),
        ),
      );
      if (estimate > bound) {
        bound = estimate;
        split = i + 1;
      }
    }
    if (sample + bound === Infinity)
      throw new Error("Curve fitting arithmetic is unresolved");
    return { sample, bound, split };
  }

  /*
   * Dot product for the physical least-squares and Newton equations.
   */
  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /*
   * Euclidean point distance in millimetres.
   */
  function distance(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /*
   * Normalize a measurable tangent without inventing a direction at degeneracy.
   */
  function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    const length: number = Math.hypot(...a);
    if (!(length > 0) || length === Infinity)
      throw new Error("Observation tangent is unresolved");
    return scale(a, 1 / length);
  }
}
