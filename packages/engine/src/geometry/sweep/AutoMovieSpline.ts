/** Tension below which a segment is evaluated as the plain cubic, where the hyperbolic form loses precision. */
const CUBIC: number = 1e-4;

/** Largest tension tried by the fixed sampled-search policy. */
const MOST: number = 64;

/** Bisection steps that refine an accepted/rejected sampled-tension bracket. */
const SETTLE: number = 10;

/** Samples per segment when measuring overshoot. */
const SAMPLES: number = 16;

/**
 * The interpolating spline under tension on caller-owned arrays: one shared
 * tension chosen per profile by a sampled overshoot policy, the coefficients solved in
 * place and evaluation without allocation.
 *
 * Segment `k` of width `h` between knots `x_k` and `x_k+1` is
 * `s = h^2 (M_k sinh(tau (1 - t)) + M_k+1 sinh(tau t)) / (tau^2 sinh tau) + (y_k - M_k h^2 / tau^2)(1 - t) + (y_k+1 - M_k+1 h^2 / tau^2) t`
 * at `t = (x - x_k) / h`, the spline under tension of Schweikert (1966, J.
 * Math. Phys. 45:312-317) as Cline wrote it (1974, Comm. ACM 17(4):218-220)
 * with tension `sigma = tau / h`; `M` is its second derivative at the knots,
 * so the curve is C2 for every tension, a cubic spline at tension 0 and the
 * piecewise-linear interpolant in the limit. An open profile has natural
 * ends, second derivative 0, and holds its end values outside its knots; a
 * periodic one closes across its period.
 *
 * `fit` first tries tension 0. It checks fifteen interior locations per
 * segment against the knot range expanded by a tenth of the largest value
 * step within two segments. If that scan fails, it doubles tension from
 * 1/2, then bisects the rejected/accepted bracket ten times, up to 64.
 * The scan does not bound extrema between probes, and reaching 64 returns
 * that tension even if the scan still fails. Positive values need not stay
 * positive between knots. Unlike a monotone cubic, the spline preserves
 * curvature continuity at interior knots; its constant open-end extension
 * need not preserve the endpoint's first derivative.
 *
 * @evidence contracts/common.md#principled-implementation The spline under tension, C2 for every tension, with tension selected by the stated sampled overshoot policy and capped at 64; between-probe extrema and acceptance at that cap are not guaranteed: the standard remedy between a cubic spline's overshoot and a monotone cubic's curvature jumps.
 * @evidence contracts/common.md#clear-and-simple-design One implementation for the closure API and every in-place caller: `fit` solves, `evaluate` reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inputs are not validated here; `interpolateAutoMovieSpline` validates, and compiled profiles were validated when compiled. The bound, its sampling and the tension search are fixed constants, not tuned per caller.
 * @evidence contracts/common.md#meaningful-documentation States the segment formula and its sources, the end and periodic conditions, the tension rule, the bound and why it replaces the monotone cubic.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A namespace; costs are on its members.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A namespace; its members are the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A namespace retaining nothing.
 */
export namespace AutoMovieSpline {
  /** Allowed overshoot of a segment beyond its knots' range, as a fraction of the local variation. */
  export const BOUND: number = 0.1;

  /**
   * Choose the sampled-policy tension and solve the knots' second derivatives.
   *
   * @param xs Strictly increasing knots, at least `n`.
   * @param ys Values, at least `n`.
   * @param n Number of knots used.
   * @param period Repeat length, or 0 for an open profile.
   * @param m Receives the `n` second derivatives.
   * @param scratch At least `7 n + 17` numbers, overwritten.
   * @returns The tension.
   *
   * @evidence contracts/common.md#principled-implementation The tridiagonal continuity system of the spline under tension, solved by elimination, cyclic for a periodic profile by the Sherman-Morrison correction, and a bounded search for a tension accepted by the sampled overshoot check; the cap can return without acceptance.
   * @evidence contracts/common.md#clear-and-simple-design One solve per trial tension and one overshoot scan, in the caller's arrays.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The search stops at the stated largest tension rather than looping.
   * @evidence contracts/common.md#meaningful-documentation States the arrays, the return and the search.
   * @evidence contracts/performance.md#efficient-algorithms O(n) per trial, 16 samples per segment for the scan with their hyperbolic weights tabulated once per trial, at most about 18 trials and one when the cubic already meets the bound; no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per profile change; the coefficients are the reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; writes only `m` and `scratch`.
   */
  export function fit(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    n: number,
    period: number,
    m: { [index: number]: number },
    scratch: { [index: number]: number },
  ): number {
    if (n < 3 && period === 0) {
      for (let k: number = 0; k < n; ++k) m[k] = 0;
      return 0;
    }
    if (n < 2) {
      if (n === 1) m[0] = 0;
      return 0;
    }
    if (admits(xs, ys, n, period, 0, m, scratch)) return 0;
    let low: number = 0;
    let high: number = 0.5;
    while (!admits(xs, ys, n, period, high, m, scratch)) {
      low = high;
      if (high >= MOST) return high;
      high = Math.min(MOST, 2 * high);
    }
    for (let k: number = 0; k < SETTLE; ++k) {
      const middle: number = (low + high) / 2;
      if (admits(xs, ys, n, period, middle, m, scratch)) high = middle;
      else low = middle;
    }
    solve(xs, ys, n, period, high, m, scratch);
    return high;
  }

  /**
   * Evaluate the spline at `x`.
   *
   * @param xs Knots, as given to `fit`.
   * @param ys Values, as given to `fit`.
   * @param m Second derivatives from `fit`.
   * @param n Number of knots used.
   * @param period Repeat length, or 0 for an open profile.
   * @param tension The tension `fit` returned.
   * @param input Abscissa.
   * @returns The value.
   *
   * @evidence contracts/common.md#principled-implementation The segment formula of the spline under tension, its cubic limit below a stated tension, and constant extension beyond an open profile's ends.
   * @evidence contracts/common.md#clear-and-simple-design One evaluation for every caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No curve is extended beyond an open profile's knots.
   * @evidence contracts/common.md#meaningful-documentation States the extension and the wrap.
   * @evidence contracts/performance.md#efficient-algorithms O(log n) binary search plus two hyperbolic sines, or a cubic, with no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export function evaluate(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    m: ArrayLike<number>,
    n: number,
    period: number,
    tension: number,
    input: number,
  ): number {
    if (n === 1) return ys[0]!;
    const first: number = xs[0]!;
    const last: number = xs[n - 1]!;
    let x: number = input;
    if (period !== 0) x = ((((x - first) % period) + period) % period) + first;
    else {
      if (x <= first) return ys[0]!;
      if (x >= last) return ys[n - 1]!;
    }
    let low: number = 0;
    let high: number = n - 1;
    if (x >= last) low = n - 1;
    else
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (xs[middle]! <= x) low = middle;
        else high = middle;
      }
    return segment(
      xs,
      ys,
      m,
      n,
      period,
      tension,
      low,
      (x - xs[low]!) / width(xs, n, period, low),
    );
  }

  /** Whether the spline at a tension meets the overshoot bound, leaving its coefficients in `m`. */
  function admits(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    n: number,
    period: number,
    tension: number,
    m: { [index: number]: number },
    scratch: { [index: number]: number },
  ): boolean {
    solve(xs, ys, n, period, tension, m, scratch);
    return within(xs, ys, m, n, period, tension, scratch);
  }

  /** The spline on segment `k` at its own parameter `t`. */
  function segment(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    m: { readonly [index: number]: number },
    n: number,
    period: number,
    tension: number,
    k: number,
    t: number,
  ): number {
    const l: number = (k + 1) % n;
    const h: number = width(xs, n, period, k);
    const y0: number = ys[k]!;
    const y1: number = ys[l]!;
    const m0: number = m[k]!;
    const m1: number = m[l]!;
    if (tension < CUBIC) {
      const r: number = 1 - t;
      return (
        r * y0 +
        t * y1 +
        ((h * h) / 6) * (m0 * (r * r * r - r) + m1 * (t * t * t - t))
      );
    }
    const scale: number = (h * h) / (tension * tension);
    return (
      (scale *
        (m0 * Math.sinh(tension * (1 - t)) + m1 * Math.sinh(tension * t))) /
        Math.sinh(tension) +
      (y0 - m0 * scale) * (1 - t) +
      (y1 - m1 * scale) * t
    );
  }

  /** Width of segment `k`, the wrap segment's taken across the period. */
  function width(
    xs: ArrayLike<number>,
    n: number,
    period: number,
    k: number,
  ): number {
    return k < n - 1 ? xs[k + 1]! - xs[k]! : xs[0]! + period - xs[n - 1]!;
  }

  /** The two coefficients of a segment of width `h` in the continuity system: its own and its neighbour's. */
  function own(h: number, tension: number): number {
    return tension < CUBIC
      ? h / 3
      : h *
          (Math.cosh(tension) / (tension * Math.sinh(tension)) -
            1 / (tension * tension));
  }
  function across(h: number, tension: number): number {
    return tension < CUBIC
      ? h / 6
      : h * (1 / (tension * tension) - 1 / (tension * Math.sinh(tension)));
  }

  /**
   * Solve the knots' second derivatives at one tension: natural ends, or cyclic for a period by the
   * Sherman-Morrison correction (Press et al., Numerical Recipes, section 2.7). `scratch` holds the
   * sub-diagonal, diagonal, super-diagonal and right side from 0, n, 2n and 3n, the elimination's
   * work from 4n and 5n, and the correction column from 6n.
   */
  function solve(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    n: number,
    period: number,
    tension: number,
    m: { [index: number]: number },
    scratch: { [index: number]: number },
  ): void {
    const segments: number = period === 0 ? n - 1 : n;
    // knot i's row joins segments i - 1 and i
    const first: number = period === 0 ? 1 : 0;
    const count: number = period === 0 ? n - 2 : n;
    for (let r: number = 0; r < count; ++r) {
      const i: number = first + r;
      const before: number = (i + segments - 1) % segments;
      const after: number = i % segments;
      const hb: number = width(xs, n, period, before);
      const ha: number = width(xs, n, period, after);
      scratch[r] = across(hb, tension);
      scratch[n + r] = own(hb, tension) + own(ha, tension);
      scratch[2 * n + r] = across(ha, tension);
      scratch[3 * n + r] =
        (ys[(after + 1) % n]! - ys[after]!) / ha -
        (ys[(before + 1) % n]! - ys[before]!) / hb;
    }
    if (period === 0) {
      m[0] = 0;
      m[n - 1] = 0;
      eliminate(count, n, 3 * n, scratch, m, 1);
      return;
    }
    if (n === 2) {
      // both neighbours of each knot are the other knot
      const b0: number = scratch[n]!;
      const c0: number = scratch[0]! + scratch[2 * n]!;
      const c1: number = scratch[1]! + scratch[2 * n + 1]!;
      const b1: number = scratch[n + 1]!;
      const det: number = b0 * b1 - c0 * c1;
      m[0] = (scratch[3 * n]! * b1 - c0 * scratch[3 * n + 1]!) / det;
      m[1] = (b0 * scratch[3 * n + 1]! - c1 * scratch[3 * n]!) / det;
      return;
    }
    // corners: beta in row 0 at column n - 1, alpha in row n - 1 at column 0
    const beta: number = scratch[0]!;
    const alpha: number = scratch[2 * n + n - 1]!;
    const gamma: number = -scratch[n]!;
    scratch[n] = scratch[n]! - gamma;
    scratch[2 * n - 1] = scratch[2 * n - 1]! - (alpha * beta) / gamma;
    eliminate(n, n, 3 * n, scratch, m, 0);
    for (let r: number = 0; r < n; ++r)
      scratch[3 * n + r] = r === 0 ? gamma : r === n - 1 ? alpha : 0;
    eliminate(n, n, 3 * n, scratch, scratch, 6 * n);
    const z: number = 6 * n;
    const factor: number =
      (m[0]! + (beta * m[n - 1]!) / gamma) /
      (1 + scratch[z]! + (beta * scratch[z + n - 1]!) / gamma);
    for (let r: number = 0; r < n; ++r) m[r] = m[r]! - factor * scratch[z + r]!;
  }

  /**
   * Solve the tridiagonal rows held in `scratch` (sub-diagonal from 0, diagonal from `n`, super-diagonal
   * from `2n`, right side from `rhs`) into `out` from `offset`, by elimination using `scratch` from `4n`.
   */
  function eliminate(
    count: number,
    n: number,
    rhs: number,
    scratch: { [index: number]: number },
    out: { [index: number]: number },
    offset: number,
  ): void {
    if (count <= 0) return;
    const cp: number = 4 * n;
    const dp: number = 5 * n;
    scratch[cp] = scratch[2 * n]! / scratch[n]!;
    scratch[dp] = scratch[rhs]! / scratch[n]!;
    for (let r: number = 1; r < count; ++r) {
      const denominator: number =
        scratch[n + r]! - scratch[r]! * scratch[cp + r - 1]!;
      scratch[cp + r] = scratch[2 * n + r]! / denominator;
      scratch[dp + r] =
        (scratch[rhs + r]! - scratch[r]! * scratch[dp + r - 1]!) / denominator;
    }
    out[offset + count - 1] = scratch[dp + count - 1]!;
    for (let r: number = count - 2; r >= 0; --r)
      out[offset + r] =
        scratch[dp + r]! - scratch[cp + r]! * out[offset + r + 1]!;
  }

  /** Whether the sampled fractions of every segment stay within the knot range plus the allowed local variation. */
  function within(
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    m: { readonly [index: number]: number },
    n: number,
    period: number,
    tension: number,
    scratch: { [index: number]: number },
  ): boolean {
    const segments: number = period === 0 ? n - 1 : n;
    // the sample fractions are shared by every segment, so their hyperbolic weights are too
    const table: number = 7 * n;
    for (let j: number = 0; j <= SAMPLES; ++j)
      scratch[table + j] =
        tension < CUBIC
          ? 0
          : Math.sinh((tension * j) / SAMPLES) / Math.sinh(tension);
    for (let k: number = 0; k < segments; ++k) {
      const l: number = (k + 1) % n;
      const low: number = Math.min(ys[k]!, ys[l]!);
      const high: number = Math.max(ys[k]!, ys[l]!);
      let variation: number = 0;
      for (let j: number = k - 2; j <= k + 2; ++j)
        variation = Math.max(variation, rise(ys, n, segments, period, j));
      const allowed: number = BOUND * variation;
      const h: number = width(xs, n, period, k);
      const scale: number =
        tension < CUBIC ? (h * h) / 6 : (h * h) / (tension * tension);
      for (let j: number = 1; j < SAMPLES; ++j) {
        const t: number = j / SAMPLES;
        const r: number = 1 - t;
        // the segment formula of `segment`, with the shared weights
        const y: number =
          tension < CUBIC
            ? r * ys[k]! +
              t * ys[l]! +
              scale * (m[k]! * (r * r * r - r) + m[l]! * (t * t * t - t))
            : scale *
                (m[k]! * scratch[table + SAMPLES - j]! +
                  m[l]! * scratch[table + j]!) +
              (ys[k]! - m[k]! * scale) * r +
              (ys[l]! - m[l]! * scale) * t;
        if (y > high + allowed || y < low - allowed) return false;
      }
    }
    return true;
  }

  /** The value step of segment `k`, 0 beyond an open profile's ends. */
  function rise(
    ys: ArrayLike<number>,
    n: number,
    segments: number,
    period: number,
    k: number,
  ): number {
    return period === 0 && (k < 0 || k >= segments)
      ? 0
      : Math.abs(ys[(((k + 1) % n) + n) % n]! - ys[((k % n) + n) % n]!);
  }
}
