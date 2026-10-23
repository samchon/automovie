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
    const solve = (r: number[]): number[] => {
      const out: number[] = new Array<number>(count).fill(0);
      for (let q: number = 0; q < count; q++) {
        let lr: number = 0;
        let li: number = 0;
        let rr: number = 0;
        let ri: number = 0;
        for (let k: number = 0; k < count; k++) {
          const angle: number = (-2 * Math.PI * q * k) / count;
          lr += g[k]! * Math.cos(angle);
          li += g[k]! * Math.sin(angle);
          rr += r[k]! * Math.cos(angle);
          ri += r[k]! * Math.sin(angle);
        }

        // Complex division (rr + i ri) / (lr + i li), then inverse DFT.
        const norm: number = lr * lr + li * li;
        const cr: number = (rr * lr + ri * li) / norm;
        const ci: number = (ri * lr - rr * li) / norm;
        for (let k: number = 0; k < count; k++) {
          const angle: number = (2 * Math.PI * q * k) / count;
          out[k]! += (cr * Math.cos(angle) - ci * Math.sin(angle)) / count;
        }
      }
      return out;
    };
    return [...solve(rx), ...solve(rz)];
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
