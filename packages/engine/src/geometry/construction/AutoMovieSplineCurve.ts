/**
 * Closed planar curve written as a uniform periodic cubic B-spline.
 *
 * A section curve of a spline chain is described in its section plane by N
 * control points `P_0 .. P_{N-1}` in millimetres. The phase `t` in
 * `[0, 2pi)` maps to the knot parameter `u = N t / 2pi`; on the span
 * `[i, i+1)` the curve is
 *
 * ```text
 * C(u) = B0(f) P_{i-1} + B1(f) P_i + B2(f) P_{i+1} + B3(f) P_{i+2},  f = u - i
 * ```
 *
 * with the uniform cubic B-spline weights `B0 .. B3` and indices taken
 * modulo N. Every control point shapes only the four spans around it, so a
 * sharp feature (a pinch at a contact, a lip corner) stays where it is,
 * unlike a truncated Fourier series, whose every term spans the whole
 * section and spreads such a feature around it as ringing. This is the
 * section form of standard B-spline skinning.
 *
 * The mean of the control points is the curve's mean over uniform phase, so
 * the sequence of control-point means along a chain is its central axis, as
 * the constant terms are for {@link AutoMovieHarmonicCurve}.
 *
 * Coefficient layout for N control points is
 * `[x_0, ..., x_{N-1}, z_0, ..., z_{N-1}]`, `2N` numbers in total.
 *
 * @evidence contracts/common.md#principled-implementation A section as a uniform periodic cubic B-spline is C2 in phase, and interpolation uses the periodic filter of the B-spline's inverse.
 * @evidence contracts/common.md#clear-and-simple-design One coefficient layout and evaluate, jet, interpolate and project functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derivatives are the basis's own, scaled exactly by the phase's period.
 * @evidence contracts/common.md#meaningful-documentation States the layout, the knot phases and the filter's truncation.
 * @evidence contracts/performance.md#efficient-algorithms Evaluation reads four controls; knot interpolation uses a fixed-width O(N) filter, while least-squares projection uses O(M+N^2) direct Fourier work rather than an FFT.
 * @evidence contracts/performance.md#reuse-equivalent-work The inverse-knot filter is module-constant; least-squares projections share sine/cosine tables keyed by control count, independent of sample values and cutoff.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Results are caller-owned, but TURNS retains two N-by-N Float64Arrays per encountered count until process exit with no count, byte bound or release policy; this is unresolved retention debt.
 */
export namespace AutoMovieSplineCurve {
  /**
   * Offset of the z block in the coefficient array of N control points.
   *
   * @evidence contracts/common.md#principled-implementation Each coordinate has N controls, so the second block starts at offset N.
   * @evidence contracts/common.md#clear-and-simple-design The identity layout helper keeps the spline offset convention with its reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not round or validate the supplied count or reinterpret it as harmonic order.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the per-coordinate offset from the 2N-entry complete layout.
   * @evidence contracts/performance.md#efficient-algorithms Returns the count directly in constant time without allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar layout identity coordinates no repeated work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a number and acquires no state or resource.
   */
  export function width(count: number): number {
    return count;
  }

  /**
   * Evaluate the curve and its phase derivative.
   *
   * @param coefficients Control points in the layout above.
   * @param count Number of control points N.
   * @param t Phase in radians, any real value.
   * @returns `[x, z, dx/dt, dz/dt]` in mm and mm per radian.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates the four local uniform periodic cubic basis functions and their analytic first derivative, scaled from control parameter to radians by N/(2pi).
   * @evidence contracts/common.md#clear-and-simple-design Both coordinate blocks share one wrapped span, basis and support-index calculation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supplied controls and ordinary periodic wrapping without fitting, finite differences or normalization; positive integer N and complete finite controls are producer premises.
   * @evidence contracts/common.md#meaningful-documentation Gives layout, phase periodicity and returned value/derivative units.
   * @evidence contracts/performance.md#efficient-algorithms Constant work reads four controls per coordinate regardless of total N and allocates only the fixed-size result.
   * @evidence contracts/performance.md#reuse-equivalent-work Value and derivative components reuse the same four support indices and local parameter; this reader owns no prepared-station cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new four-number tuple without retaining the coefficient array or any query state.
   */
  export function evaluate(
    coefficients: readonly number[],
    count: number,
    t: number,
  ): [number, number, number, number] {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * count;
    const i: number = Math.min(count - 1, Math.floor(u));
    const f: number = u - i;
    const g: number = 1 - f;

    // The four weights and their derivatives, written out.
    const w0: number = (g * g * g) / 6;
    const w1: number = (3 * f * f * f - 6 * f * f + 4) / 6;
    const w2: number = (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6;
    const w3: number = (f * f * f) / 6;
    const d0: number = -(g * g) / 2;
    const d1: number = (3 * f * f - 4 * f) / 2;
    const d2: number = (-3 * f * f + 2 * f + 1) / 2;
    const d3: number = (f * f) / 2;
    const j0: number = (i - 1 + count) % count;
    const j1: number = i % count;
    const j2: number = (i + 1) % count;
    const j3: number = (i + 2) % count;
    const c: readonly number[] = coefficients;

    // Chain rule: du/dt = N / 2pi.
    const scale: number = count / (2 * Math.PI);
    return [
      w0 * c[j0]! + w1 * c[j1]! + w2 * c[j2]! + w3 * c[j3]!,
      w0 * c[count + j0]! +
        w1 * c[count + j1]! +
        w2 * c[count + j2]! +
        w3 * c[count + j3]!,
      (d0 * c[j0]! + d1 * c[j1]! + d2 * c[j2]! + d3 * c[j3]!) * scale,
      (d0 * c[count + j0]! +
        d1 * c[count + j1]! +
        d2 * c[count + j2]! +
        d3 * c[count + j3]!) *
        scale,
    ];
  }

  /**
   * Control points of the spline through N points at phases `2pi m / N`.
   *
   * The curve at a knot is `(P_{i-1} + 4 P_i + P_{i+1}) / 6`. The inverse of
   * that periodic filter is `sqrt(3) (sqrt(3) - 2)^|k|`, whose 32nd weight is
   * under `1e-18`, so the knots are met to rounding (14 neighbours left `3e-9`
   * of the radius off a guide) and a section costs O(N) rather than the
   * O(N^2) of {@link project}.
   *
   * @param samples Points `[x, z]`, one per control point.
   * @returns Control points in the layout above.
   *
   * @evidence contracts/common.md#principled-implementation Convolves uniformly spaced knot samples with the inverse cubic knot filter, wrapping indices periodically; truncation at distance 32 leaves a geometric coefficient tail rather than an exact symbolic inverse.
   * @evidence contracts/common.md#clear-and-simple-design One periodic convolution prepares both coordinate blocks with a shared fixed filter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no point-specific corrections; valid ordered knot samples are the caller's premise, and finite filter truncation is explicit.
   * @evidence contracts/common.md#meaningful-documentation Gives the knot equation, inverse-filter formula, truncation scale and returned layout.
   * @evidence contracts/performance.md#efficient-algorithms Each of N samples visits 65 fixed filter offsets, giving O(N) time and O(N) output rather than a dense interpolation solve.
   * @evidence contracts/performance.md#reuse-equivalent-work The 33 absolute-distance weights are computed once at module load and reused for every sample and both coordinates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one 2N-entry output; only the fixed 33-number FILTER is process-retained by this path, and no sample input is kept.
   */
  export function interpolate(
    samples: readonly (readonly [number, number])[],
  ): number[] {
    const n: number = samples.length;
    const out: number[] = new Array<number>(2 * n).fill(0);
    samples.forEach((p: readonly [number, number], m: number): void => {
      for (let k: number = -FILTER.length + 1; k < FILTER.length; k++) {
        const j: number = (((m + k) % n) + n) % n;
        const w: number = FILTER[Math.abs(k)]!;
        out[j]! += w * p[0];
        out[n + j]! += w * p[1];
      }
    });
    return out;
  }

  /**
   * Evaluate the curve with its first and second phase derivatives.
   *
   * The same span and weights as {@link evaluate}, with the cubic weights'
   * second derivatives `[1 - f, 3 f - 2, 1 - 3 f, f]` scaled by
   * `(N / 2pi)^2`, so a surface's phase curvature is exact.
   *
   * @param coefficients Control points in the layout above.
   * @param count Number of control points N.
   * @param t Phase in radians, any real value.
   * @returns `[x, z, dx/dt, dz/dt, d2x/dt2, d2z/dt2]`.
   *
   * @evidence contracts/common.md#principled-implementation Differentiates the same local cubic basis twice, applying N/(2pi) and its square for first and second radian derivatives on admitted periodic controls.
   * @evidence contracts/common.md#clear-and-simple-design One span reading returns the point and both derivative orders required by surface jets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Computes polynomial derivatives directly without sampled differences or altered controls; valid count/layout and representable scaling remain caller premises.
   * @evidence contracts/common.md#meaningful-documentation Specifies derivative ordering, basis second derivatives and the radian chain-rule factors.
   * @evidence contracts/performance.md#efficient-algorithms Constant work reads eight coordinate controls and returns six numbers, independent of the whole section order.
   * @evidence contracts/performance.md#reuse-equivalent-work Loaded controls, support indices and basis powers serve all three derivative orders in the same call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the caller-owned six-number tuple escapes; no coefficient reference or phase cache is retained.
   */
  export function jet(
    coefficients: readonly number[],
    count: number,
    t: number,
  ): [number, number, number, number, number, number] {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * count;
    const i: number = Math.min(count - 1, Math.floor(u));
    const f: number = u - i;
    const g: number = 1 - f;

    // The four weights with their first and second derivatives, written out.
    const w0: number = (g * g * g) / 6;
    const w1: number = (3 * f * f * f - 6 * f * f + 4) / 6;
    const w2: number = (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6;
    const w3: number = (f * f * f) / 6;
    const d0: number = -(g * g) / 2;
    const d1: number = (3 * f * f - 4 * f) / 2;
    const d2: number = (-3 * f * f + 2 * f + 1) / 2;
    const d3: number = (f * f) / 2;
    const e0: number = g;
    const e1: number = 3 * f - 2;
    const e2: number = 1 - 3 * f;
    const e3: number = f;
    const j0: number = (i - 1 + count) % count;
    const j1: number = i % count;
    const j2: number = (i + 1) % count;
    const j3: number = (i + 2) % count;
    const c: readonly number[] = coefficients;
    const x0: number = c[j0]!;
    const x1: number = c[j1]!;
    const x2: number = c[j2]!;
    const x3: number = c[j3]!;
    const z0: number = c[count + j0]!;
    const z1: number = c[count + j1]!;
    const z2: number = c[count + j2]!;
    const z3: number = c[count + j3]!;
    const scale: number = count / (2 * Math.PI);
    const scale2: number = scale * scale;
    return [
      w0 * x0 + w1 * x1 + w2 * x2 + w3 * x3,
      w0 * z0 + w1 * z1 + w2 * z2 + w3 * z3,
      (d0 * x0 + d1 * x1 + d2 * x2 + d3 * x3) * scale,
      (d0 * z0 + d1 * z1 + d2 * z2 + d3 * z3) * scale,
      (e0 * x0 + e1 * x1 + e2 * x2 + e3 * x3) * scale2,
      (e0 * z0 + e1 * z1 + e2 * z2 + e3 * z3) * scale2,
    ];
  }

  /**
   * Least-squares control points of samples at uniform phases.
   *
   * The samples must number a multiple of N. Then every control point sees
   * the same pattern of samples, the normal matrix is circulant, and the
   * system is solved exactly in its discrete Fourier basis in O(N^2).
   *
   * With a cutoff, the fit is a penalized spline (P-spline): the squared
   * second differences of the control points are added with the weight at
   * which a sinusoid of `cutoff` cycles per section keeps half its
   * amplitude. Longer waves pass almost unchanged, shorter ones (the source
   * mesh's facets) are suppressed, and the response falls smoothly, so the
   * frequency response is smooth. That response alone is not a proof against
   * spatial overshoot or ringing in the fitted curve.
   *
   * @param samples Points `[x, z]` at phases `2pi m / M`, m = 0 .. M-1.
   * @param count Number of control points N.
   * @param cutoff Half-response frequency in cycles per section; omitted,
   *   plain least squares.
   *
   * @evidence contracts/common.md#principled-implementation Uniform M samples with M a multiple of positive N make the normal matrix circulant; its direct Fourier eigenbasis solves both coordinate right-hand sides, optionally adding the declared second-difference penalty.
   * @evidence contracts/common.md#clear-and-simple-design Local normal-row/right-hand-side accumulation and one shared Fourier basis keep the ordinary and penalized fits in one solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects a nonmultiple sample count; count validity, finite data and nonsingular Fourier denominators remain caller premises, and cutoff is explicitly restricted to the implemented frequency range rather than an exact pass-through guarantee.
   * @evidence contracts/common.md#meaningful-documentation States uniform phases, normal-matrix structure, cutoff half-response meaning and the limits of the smooth frequency-response claim.
   * @evidence contracts/performance.md#efficient-algorithms O(M+N^2) accumulation/direct transforms and O(N^2) transform tables avoid a dense O(N^3) solve; the implementation does not use an FFT and is not claimed optimal for unbounded N.
   * @evidence contracts/performance.md#reuse-equivalent-work Within a fit both coordinates share normal eigenvalues and turns; across fits TURNS shares tables by N because those tables depend only on N, with no sample/cutoff/effect reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local O(N) solve arrays and 2N output have call/result lifetimes, but each new N permanently adds two N-by-N Float64Arrays (16N^2 payload bytes) to an unbounded process Map; no eviction or release exists.
   */
  export function project(
    samples: readonly (readonly [number, number])[],
    count: number,
    cutoff?: number,
  ): number[] {
    const M: number = samples.length;
    if (M % count !== 0)
      throw new Error(
        `${M} samples are not a multiple of ${count} control points`,
      );

    // Right-hand side A^T b and the first row of the circulant A^T A.
    const rx: number[] = new Array<number>(count).fill(0);
    const rz: number[] = new Array<number>(count).fill(0);
    const g: number[] = new Array<number>(count).fill(0);
    samples.forEach((p: readonly [number, number], m: number): void => {
      const u: number = (m * count) / M;
      const i: number = Math.floor(u);
      const w: number[] = weights(u - i);
      for (let a: number = 0; a < 4; a++) {
        const ja: number = (((i - 1 + a) % count) + count) % count;
        rx[ja]! += w[a]! * p[0];
        rz[ja]! += w[a]! * p[1];

        // Every sample pattern repeats per span, so the products of one
        // span's samples, accumulated by offset, give the circulant row.
        if (i === 0)
          for (let b: number = 0; b < 4; b++)
            g[(((b - a) % count) + count) % count]! += w[a]! * w[b]!;
      }
    });

    // Second-difference penalty, itself circulant [1, -4, 6, -4, 1], with
    // the weight that halves the response at the cutoff: the data
    // eigenvalue there equals the penalty eigenvalue there.
    if (cutoff !== undefined) {
      // At least two cycles: the position and the ellipse always pass.
      const omega: number =
        (2 * Math.PI * Math.min(Math.max(2, cutoff), count / 2)) / count;
      let data: number = 0;
      for (let k: number = 0; k < count; k++)
        data += g[k]! * Math.cos(omega * k);
      const lambda: number = data / (2 - 2 * Math.cos(omega)) ** 2;
      const stencil: [number, number][] = [
        [0, 6],
        [1, -4],
        [count - 1, -4],
        [2, 1],
        [count - 2, 1],
      ];
      for (const [k, v] of stencil) g[k]! += lambda * v;
    }

    // Eigenvalues of the circulant matrix and the solution per frequency.
    const turns: ITurns = turnsOf(count);
    const [lr, li] = transform(g, turns);
    const solve = (r: number[]): number[] => {
      const [rr, ri] = transform(r, turns);
      const out: number[] = new Array<number>(count).fill(0);
      for (let q: number = 0; q < count; q++) {
        // Complex division (rr + i ri) / (lr + i li), then inverse DFT.
        const norm: number = lr[q]! * lr[q]! + li[q]! * li[q]!;
        const cr: number = (rr[q]! * lr[q]! + ri[q]! * li[q]!) / norm;
        const ci: number = (ri[q]! * lr[q]! - rr[q]! * li[q]!) / norm;
        for (let k: number = 0; k < count; k++)
          out[k]! +=
            (cr * turns.cos[q * count + k]! - ci * turns.sin[q * count + k]!) /
            count;
      }
      return out;
    };
    return [...solve(rx), ...solve(rz)];
  }

  /** Discrete Fourier transform, real and imaginary parts. */
  function transform(
    values: readonly number[],
    turns: ITurns,
  ): [Float64Array, Float64Array] {
    const count: number = values.length;
    const real: Float64Array = new Float64Array(count);
    const imaginary: Float64Array = new Float64Array(count);
    for (let q: number = 0; q < count; q++)
      for (let k: number = 0; k < count; k++) {
        real[q]! += values[k]! * turns.cos[q * count + k]!;
        imaginary[q]! -= values[k]! * turns.sin[q * count + k]!;
      }
    return [real, imaginary];
  }

  /** Uniform cubic B-spline weights of P_{i-1} .. P_{i+2} at span fraction f. */
  function weights(f: number): number[] {
    const g: number = 1 - f;
    return [
      (g * g * g) / 6,
      (3 * f * f * f - 6 * f * f + 4) / 6,
      (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6,
      (f * f * f) / 6,
    ];
  }
}

/** Cosine and sine of `2 pi q k / N`, row q of N entries each. */
interface ITurns {
  /** Row-major cos(2pi*q*k/N), N entries per frequency row. */
  cos: Float64Array;

  /** Matching row-major sine values, independent of fitted samples. */
  sin: Float64Array;
}

/** Process-wide transform tables by control count, with no population/byte limit or eviction. */
const TURNS: Map<number, ITurns> = new Map();

/** Read or permanently retain two N-by-N turn arrays for a control count; sample values and cutoff do not affect them. */
function turnsOf(count: number): ITurns {
  const found: ITurns | undefined = TURNS.get(count);
  if (found !== undefined) return found;
  const cos: Float64Array = new Float64Array(count * count);
  const sin: Float64Array = new Float64Array(count * count);
  for (let q: number = 0; q < count; q++)
    for (let k: number = 0; k < count; k++) {
      const angle: number = (2 * Math.PI * q * k) / count;
      cos[q * count + k] = Math.cos(angle);
      sin[q * count + k] = Math.sin(angle);
    }
  const turns: ITurns = { cos, sin };
  TURNS.set(count, turns);
  return turns;
}

/** Weights of the inverse knot filter by distance. */
const FILTER: number[] = Array.from(
  { length: 33 },
  (_: unknown, k: number): number => Math.sqrt(3) * (Math.sqrt(3) - 2) ** k,
);
