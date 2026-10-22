/**
 * Closed planar curve written as a truncated Fourier series per coordinate.
 *
 * A section curve lies in a horizontal plane and is described in world X/Z
 * millimetres by
 *
 * ```text
 * x(t) = a0 + sum_k ( a_k cos kt + b_k sin kt )
 * z(t) = c0 + sum_k ( c_k cos kt + d_k sin kt )
 * ```
 *
 * The constant terms are the section's centroid, so the sequence of constant
 * terms along a chain is that chain's central axis. The phase `t` is the
 * chain's correspondence parameter, chosen by its
 * {@link AutoMovieHumanLoftParameter} rule; it is not an arclength or a polar
 * angle unless that rule makes it one.
 *
 * Unlike a polar radius function, this form represents any closed curve,
 * including non-star sections such as the shoulder girdle and the pinched
 * figure-eight at a branch event.
 *
 * Coefficient layout for order K is
 * `[x0, x1c, x1s, ..., xKc, xKs, z0, z1c, z1s, ..., zKc, zKs]`,
 * `2 * (2K + 1)` numbers in total.
 */
export namespace AutoMovieHumanHarmonicCurve {
  /** Number of coefficients of one coordinate series of the given order. */
  export function width(order: number): number {
    return 2 * order + 1;
  }

  /**
   * Evaluate the curve point and its phase derivative at phase t.
   *
   * @param coefficients Coefficients in the layout above, in mm.
   * @param order Highest harmonic K.
   * @param t Phase in radians.
   * @returns `[x, z, dx/dt, dz/dt]` in mm and mm per radian.
   */
  export function evaluate(
    coefficients: readonly number[],
    order: number,
    t: number,
  ): [number, number, number, number] {
    // The z series starts right after the 2K+1 x coefficients.
    const offset: number = width(order);

    // Constant terms are the centroid; they have no phase derivative.
    let x: number = coefficients[0]!;
    let z: number = coefficients[offset]!;
    let dx: number = 0;
    let dz: number = 0;

    for (let k: number = 1; k <= order; k++) {
      const c: number = Math.cos(k * t);
      const s: number = Math.sin(k * t);

      const xc: number = coefficients[2 * k - 1]!;
      const xs: number = coefficients[2 * k]!;
      const zc: number = coefficients[offset + 2 * k - 1]!;
      const zs: number = coefficients[offset + 2 * k]!;

      x += xc * c + xs * s;
      z += zc * c + zs * s;

      // d/dt (a cos kt + b sin kt) = k (b cos kt - a sin kt)
      dx += k * (xs * c - xc * s);
      dz += k * (zs * c - zc * s);
    }
    return [x, z, dx, dz];
  }

  /**
   * Least-squares coefficients of a closed curve sampled at uniform phases.
   *
   * With `n` samples at phases `2*pi*i/n` and `n > 2K`, the sampled cosines
   * and sines up to order K are orthogonal, so the normal equations are
   * diagonal and the least-squares solution is the discrete Fourier
   * projection computed here. The observation fitter supplies such samples
   * after resampling a recovered section by its chain's phase rule; the
   * generator never fits.
   *
   * @param samples `[x, z]` points in mm at phases `2*pi*i/n`.
   * @param order Highest harmonic K.
   */
  export function project(
    samples: readonly (readonly [number, number])[],
    order: number,
  ): number[] {
    const n: number = samples.length;
    if (n <= 2 * order)
      throw new Error("Harmonic projection needs more samples than terms");

    const offset: number = width(order);
    const out: number[] = new Array<number>(2 * offset).fill(0);

    samples.forEach((p: readonly [number, number], i: number): void => {
      const t: number = (2 * Math.PI * i) / n;

      // Mean value: weight 1/n.
      out[0]! += p[0] / n;
      out[offset]! += p[1] / n;

      // Harmonics: weight 2/n, the inverse of the discrete norm n/2.
      for (let k: number = 1; k <= order; k++) {
        const c: number = (2 / n) * Math.cos(k * t);
        const s: number = (2 / n) * Math.sin(k * t);

        out[2 * k - 1]! += p[0] * c;
        out[2 * k]! += p[0] * s;
        out[offset + 2 * k - 1]! += p[1] * c;
        out[offset + 2 * k]! += p[1] * s;
      }
    });
    return out;
  }
}
