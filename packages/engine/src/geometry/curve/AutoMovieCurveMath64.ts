import type {
  AutoMovieVector3Tuple,
  IAutoMovieCurveMath64,
} from "@automovie/interface";

import { AutoMoviePchip64 } from "./AutoMoviePchip64";

/**
 * Binary64 vector and cubic Bernstein operations for three-component
 * coefficient fields. PCHIP supplies shape-preserving scalar station
 * derivatives; subdivision retains the requested arithmetic path rather than
 * promising symbolic exactness.
 */
export namespace AutoMovieCurveMath64 {
  /**
   * Copy the first three components into a fresh vector; the caller supplies a
   * valid three-component value.
   */
  export const clone: (a: readonly number[]) => AutoMovieVector3Tuple = (
    a: readonly number[],
  ): AutoMovieVector3Tuple => [a[0]!, a[1]!, a[2]!];

  /**
   * Add two vectors in the same chart and units; no placement or derivative
   * conversion is performed.
   */
  export const add: (
    a: readonly number[],
    b: readonly number[],
  ) => AutoMovieVector3Tuple = (
    a: readonly number[],
    b: readonly number[],
  ): AutoMovieVector3Tuple => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];

  /**
   * Subtract two vectors in the same chart and units; no placement or
   * derivative conversion is performed.
   */
  export const sub: (
    a: readonly number[],
    b: readonly number[],
  ) => AutoMovieVector3Tuple = (
    a: readonly number[],
    b: readonly number[],
  ): AutoMovieVector3Tuple => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];

  /**
   * Multiply every component by the supplied scalar; callers own the scalar's
   * physical or parameter meaning.
   */
  export const scale: (
    a: readonly number[],
    n: number,
  ) => AutoMovieVector3Tuple = (
    a: readonly number[],
    n: number,
  ): AutoMovieVector3Tuple => [a[0]! * n, a[1]! * n, a[2]! * n];

  /**
   * Affine interpolation a + (b - a)t in binary64; t is dimensionless and
   * extrapolation is not clamped.
   */
  export const mix: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ) => AutoMovieVector3Tuple = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ): AutoMovieVector3Tuple => add(a, scale(sub(b, a), t));

  /**
   * Convert endpoint values and derivatives to cubic Bernstein coefficients
   * using the supplied positive physical or phase interval dy. Derivatives are
   * with respect to that interval's chart, not the unit cubic parameter.
   */
  export const hermite: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    da: AutoMovieVector3Tuple,
    db: AutoMovieVector3Tuple,
    dy: number,
  ) => IAutoMovieCurveMath64.Span = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    da: AutoMovieVector3Tuple,
    db: AutoMovieVector3Tuple,
    dy: number,
  ): IAutoMovieCurveMath64.Span => [
    clone(a),
    add(a, scale(da, dy / 3)),
    sub(b, scale(db, dy / 3)),
    clone(b),
  ];

  /**
   * Convert exactly four cubic Bernstein controls to endpoint Hermite data on a
   * positive finite chart width. Derivatives are dP/ds, not unit directions or
   * unit-parameter derivatives. Endpoints and derivatives own fresh triples.
   * The inverse is algebraic in real arithmetic; finite evaluation does not
   * promise bitwise round trips or recover handles already lost to rounding.
   * Nonfinite input, a noncubic net and unresolved binary64 derivatives throw.
   * Existing endpoint evaluation is tried first, then fixed equivalent quotient
   * orders for unresolved components. This is not an arbitrary-precision
   * guarantee for every mathematically representable derivative.
   */
  export function toHermite(
    span: readonly (readonly number[])[],
    dy: number,
  ): IAutoMovieCurveMath64.IToHermiteResult {
    if (!(dy > 0))
      throw new Error(
        "A positive finite cubic Hermite chart width is required",
      );
    if (
      span.length !== 4 ||
      !span.every((control: readonly number[]): boolean => control.length === 3)
    )
      throw new Error(
        "Exactly four three-component cubic Bernstein controls are required",
      );
    return {
      start: clone(span[0]!),
      end: clone(span[3]!),
      startDerivative: endpointDerivative(
        span as readonly AutoMovieVector3Tuple[],
        0,
        dy,
      ),
      endDerivative: endpointDerivative(
        span as readonly AutoMovieVector3Tuple[],
        1,
        dy,
      ),
    };
  }

  /**
   * Reuse ordinary endpoint evaluation on an already admitted cubic, then try
   * endpoint-specific quotient orders only for unresolved components. Inactive
   * zero-times-overflow terms in the old polynomial formula therefore do not
   * reject a finite endpoint difference. A remaining nonfinite result or loss
   * of a nonzero difference to zero refuses conversion. These fixed binary64
   * orders are not an arbitrary-precision representability decision procedure.
   * The public conversion comment owns this private helper's Evidence answers.
   */
  function endpointDerivative(
    span: readonly AutoMovieVector3Tuple[],
    endpoint: 0 | 1,
    dy: number,
  ): AutoMovieVector3Tuple {
    // The ordinary formula weights every control by up to 24 / dy in total;
    // past that bound an inactive term can overflow, so the endpoint
    // difference is read directly instead.
    const largest: number = Math.max(
      ...span.map((control: AutoMovieVector3Tuple): number =>
        Math.max(...control.map(Math.abs)),
      ),
    );
    const ordinary: AutoMovieVector3Tuple | null =
      largest < (Number.MAX_VALUE / 24) * dy
        ? derivative(span, endpoint, dy)
        : null;
    const a: AutoMovieVector3Tuple = span[endpoint === 0 ? 0 : 2]!,
      b: AutoMovieVector3Tuple = span[endpoint === 0 ? 1 : 3]!;
    return [0, 1, 2].map((axis: number): number => {
      const delta: number = b[axis]! - a[axis]!;
      // An intermediate difference or quotient can overflow to Infinity, or
      // a tiny width underflow a nonzero difference to zero; each later form
      // reorders the same arithmetic to avoid that rounding.
      const unresolved = (candidate: number): boolean =>
        Math.abs(candidate) === Infinity ||
        (candidate === 0 && a[axis] !== b[axis]);
      let value: number = ordinary === null ? (3 * delta) / dy : ordinary[axis]!;
      if (unresolved(value)) value = (3 * delta) / dy;
      if (unresolved(value)) value = 3 * (delta / dy);
      if (unresolved(value)) value = 3 * (b[axis]! / dy - a[axis]! / dy);
      if (unresolved(value))
        throw new Error("Cubic endpoint derivative is unresolved in binary64");
      return value;
    }) as AutoMovieVector3Tuple;
  }

  /**
   * Evaluate the four-coefficient cubic Bernstein formula at dimensionless t;
   * the caller owns range checks and the coefficient units.
   */
  export const cubic: (
    a: readonly AutoMovieVector3Tuple[],
    t: number,
  ) => AutoMovieVector3Tuple = (
    a: readonly AutoMovieVector3Tuple[],
    t: number,
  ): AutoMovieVector3Tuple =>
    [0, 1, 2].map(
      (k: number): number =>
        (1 - t) ** 3 * a[0]![k]! +
        3 * (1 - t) ** 2 * t * a[1]![k]! +
        3 * (1 - t) * t * t * a[2]![k]! +
        t ** 3 * a[3]![k]!,
    ) as AutoMovieVector3Tuple;

  /**
   * Evaluate the cubic derivative divided by dy, yielding derivative per
   * physical or phase unit rather than per unit t; callers must supply nonzero
   * chart width. Signed widths and extrapolated t retain the same basis
   * arithmetic. This evaluator adds no admission or finite-result exception;
   * inverse conversion separately admits its stricter endpoint record.
   */
  export const derivative: (
    a: readonly AutoMovieVector3Tuple[],
    t: number,
    dy: number,
  ) => AutoMovieVector3Tuple = (
    a: readonly AutoMovieVector3Tuple[],
    t: number,
    dy: number,
  ): AutoMovieVector3Tuple =>
    [0, 1, 2].map(
      (k: number): number =>
        (3 / dy) *
        ((1 - t) ** 2 * (a[1]![k]! - a[0]![k]!) +
          2 * (1 - t) * t * (a[2]![k]! - a[1]![k]!) +
          t * t * (a[3]![k]! - a[2]![k]!)),
    ) as AutoMovieVector3Tuple;

  /**
   * De Casteljau subdivision at dimensionless t. The affine flag preserves the
   * caller's chosen blend operation order; both children retain the same value
   * units.
   */
  export function split(
    a: readonly AutoMovieVector3Tuple[],
    t: number,
    affine: boolean = false,
  ): [IAutoMovieCurveMath64.Span, IAutoMovieCurveMath64.Span] {
    const blend: (
      p: AutoMovieVector3Tuple,
      q: AutoMovieVector3Tuple,
    ) => AutoMovieVector3Tuple = (
      p: AutoMovieVector3Tuple,
      q: AutoMovieVector3Tuple,
    ): AutoMovieVector3Tuple =>
      affine ? mix(p, q, t) : add(scale(p, 1 - t), scale(q, t));
    const b: AutoMovieVector3Tuple[] = [
      blend(a[0]!, a[1]!),
      blend(a[1]!, a[2]!),
      blend(a[2]!, a[3]!),
    ];
    const c: AutoMovieVector3Tuple[] = [
      blend(b[0]!, b[1]!),
      blend(b[1]!, b[2]!),
    ];
    const d: AutoMovieVector3Tuple = blend(c[0]!, c[1]!);
    return [
      [clone(a[0]!), b[0]!, c[0]!, d],
      [clone(d), c[1]!, b[2]!, clone(a[3]!)],
    ];
  }

  /**
   * Subdivide one cubic by positive relative widths while retaining coefficient
   * units; nonpositive widths reject. The widths determine fractions and need
   * not sum to one.
   */
  export function partition(
    a: readonly AutoMovieVector3Tuple[],
    widths: readonly number[],
    affine: boolean = false,
  ): IAutoMovieCurveMath64.Span[] {
    if (widths.some((w: number): boolean => !(w > 0)))
      throw new Error("Positive actual phase widths required");
    let remaining: number = widths.reduce(
      (s: number, w: number): number => s + w,
      0,
    );
    let rest: IAutoMovieCurveMath64.Span = a.map(
      clone,
    ) as IAutoMovieCurveMath64.Span;
    const out: IAutoMovieCurveMath64.Span[] = [];
    for (const w of widths.slice(0, -1)) {
      const parts: [IAutoMovieCurveMath64.Span, IAutoMovieCurveMath64.Span] =
        split(rest, w / remaining, affine);
      out.push(parts[0]);
      rest = parts[1];
      remaining -= w;
    }
    return [...out, rest];
  }

  /**
   * Delegates to the engine slope owner AutoMoviePchip64.slopes with the same
   * station ordering and derivative units; that selected public operation
   * documents admission, arithmetic, cost and ownership.
   */
  export const slopes: typeof AutoMoviePchip64.slopes = AutoMoviePchip64.slopes;

  /**
   * Delegates to the engine slope owner AutoMoviePchip64.fieldSlopes with the
   * same station ordering and derivative units; that selected public operation
   * documents admission, arithmetic, cost and ownership.
   */
  export const fieldSlopes: typeof AutoMoviePchip64.fieldSlopes =
    AutoMoviePchip64.fieldSlopes;

  /**
   * Periodic scalar PCHIP over the supplied angular widths, using one wrapped
   * neighbor on each end. Returns one-third angular derivatives so multiplying
   * by a span width produces a cubic handle offset.
   */
  export function angular(
    points: readonly AutoMovieVector3Tuple[],
    widths: readonly number[],
  ): AutoMovieVector3Tuple[] {
    const phases: number[] = [0];
    for (const w of widths) phases.push(phases.at(-1)! + w);
    const xs: number[] = [
      -widths.at(-1)!,
      ...phases,
      phases.at(-1)! + widths[0]!,
    ];
    const rows: AutoMovieVector3Tuple[] = [
      points.at(-1)!,
      ...points,
      points[0]!,
      points[1]!,
    ];
    const out: AutoMovieVector3Tuple[] = points.map(
      (): AutoMovieVector3Tuple => [0, 0, 0],
    );
    for (let k: number = 0; k < 3; k++) {
      const d: number[] = slopes(
        xs,
        rows.map((p: AutoMovieVector3Tuple): number => p[k]!),
      );
      out.forEach((p: AutoMovieVector3Tuple, i: number): void => {
        p[k] = d[i + 1]! / 3;
      });
    }
    return out;
  }

  /**
   * Build a periodic cubic course from supports and one-third angular
   * derivatives. Each outgoing and next incoming handle uses that span's width;
   * array layouts must correspond.
   */
  export function spans(
    points: readonly AutoMovieVector3Tuple[],
    handles: readonly AutoMovieVector3Tuple[],
    widths: readonly number[],
  ): IAutoMovieCurveMath64.Span[] {
    return points.map(
      (p: AutoMovieVector3Tuple, i: number): IAutoMovieCurveMath64.Span => {
        const n: number = (i + 1) % points.length;
        return [
          clone(p),
          add(p, scale(handles[i]!, widths[i]!)),
          sub(points[n]!, scale(handles[n]!, widths[i]!)),
          clone(points[n]!),
        ];
      },
    );
  }
}
