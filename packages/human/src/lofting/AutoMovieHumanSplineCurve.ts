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
 * the constant terms are for {@link AutoMovieHumanHarmonicCurve}.
 *
 * Coefficient layout for N control points is
 * `[x_0, ..., x_{N-1}, z_0, ..., z_{N-1}]`, `2N` numbers in total.
 */
export namespace AutoMovieHumanSplineCurve {
  /** Offset of the z block in the coefficient array of N control points. */
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
   */
  export function evaluate(
    coefficients: readonly number[],
    count: number,
    t: number,
  ): [number, number, number, number] {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * count;
    const i: number = Math.min(count - 1, Math.floor(u));
    const f: number = u - i;
    const w: number[] = weights(f);
    const d: number[] = derivatives(f);

    // Chain rule: du/dt = N / 2pi.
    const scale: number = count / (2 * Math.PI);
    let x: number = 0;
    let z: number = 0;
    let dx: number = 0;
    let dz: number = 0;
    for (let k: number = 0; k < 4; k++) {
      const j: number = (((i - 1 + k) % count) + count) % count;
      x += w[k]! * coefficients[j]!;
      z += w[k]! * coefficients[count + j]!;
      dx += d[k]! * coefficients[j]!;
      dz += d[k]! * coefficients[count + j]!;
    }
    return [x, z, dx * scale, dz * scale];
  }

  /**
   * Control points of the spline through N points at phases `2pi m / N`.
   *
   * The curve at a knot is `(P_{i-1} + 4 P_i + P_{i+1}) / 6`. The inverse of
   * that periodic filter is `sqrt(3) (sqrt(3) - 2)^|k|`, which is negligible
   * after 14 neighbours, so a smooth section costs O(N) rather than the
   * O(N^2) of {@link project}.
   *
   * @param samples Points `[x, z]`, one per control point.
   * @returns Control points in the layout above.
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
   */
  export function jet(
    coefficients: readonly number[],
    count: number,
    t: number,
  ): [number, number, number, number, number, number] {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * count;
    const i: number = Math.min(count - 1, Math.floor(u));
    const f: number = u - i;
    const w: number[] = weights(f);
    const d: number[] = derivatives(f);
    const dd: number[] = [1 - f, 3 * f - 2, 1 - 3 * f, f];
    const scale: number = count / (2 * Math.PI);
    const out: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    for (let k: number = 0; k < 4; k++) {
      const j: number = (((i - 1 + k) % count) + count) % count;
      const x: number = coefficients[j]!;
      const z: number = coefficients[count + j]!;
      out[0] += w[k]! * x;
      out[1] += w[k]! * z;
      out[2] += d[k]! * x * scale;
      out[3] += d[k]! * z * scale;
      out[4] += dd[k]! * x * scale * scale;
      out[5] += dd[k]! * z * scale * scale;
    }
    return out;
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
   * filter itself cannot ring.
   *
   * @param samples Points `[x, z]` at phases `2pi m / M`, m = 0 .. M-1.
   * @param count Number of control points N.
   * @param cutoff Half-response frequency in cycles per section; omitted,
   *   plain least squares.
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

  /** Derivatives of the weights with respect to f. */
  function derivatives(f: number): number[] {
    const g: number = 1 - f;
    return [
      -(g * g) / 2,
      (3 * f * f - 4 * f) / 2,
      (-3 * f * f + 2 * f + 1) / 2,
      (f * f) / 2,
    ];
  }
}

/** Cosine and sine of `2 pi q k / N`, row q of N entries each. */
interface ITurns {
  cos: Float64Array;
  sin: Float64Array;
}

/** The transform's turns by control count: a body has only a few counts. */
const TURNS: Map<number, ITurns> = new Map();

/** The turns of N control points. */
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
  { length: 15 },
  (_: unknown, k: number): number =>
    Math.sqrt(3) * (Math.sqrt(3) - 2) ** k,
);
