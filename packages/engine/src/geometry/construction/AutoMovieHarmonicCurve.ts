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
 * The constant terms are the section's mean over uniform phase, which need
 * not be its polygon-area centroid; their sequence defines the chain's
 * central axis. The phase `t` is the
 * chain's correspondence parameter, chosen by its
 * {@link AutoMovieLoftParameter} rule; it is not an arclength or a polar
 * angle unless that rule makes it one.
 *
 * Unlike a polar radius function, separate coordinate series can represent
 * non-star sections such as the shoulder girdle or a pinched figure-eight.
 * A finite harmonic order still truncates the curve's available frequencies.
 *
 * Coefficient layout for order K is
 * `[x0, x1c, x1s, ..., xKc, xKs, z0, z1c, z1s, ..., zKc, zKs]`,
 * `2 * (2K + 1)` numbers in total.
 *
 * @evidence contracts/common.md#principled-implementation A section as a truncated Fourier series is the band-limited closed curve its harmonics define, with exact phase derivatives from the same coefficients.
 * @evidence contracts/common.md#clear-and-simple-design One coefficient layout, evaluated with its derivatives by one routine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derivatives are the series' own, never differences of sampled points.
 * @evidence contracts/common.md#meaningful-documentation States the coefficient layout, the harmonic order and the derivatives returned.
 * @evidence contracts/performance.md#efficient-algorithms Evaluation scans K harmonics; direct projection scans N samples for each harmonic, without a dense least-squares matrix.
 * @evidence contracts/performance.md#reuse-equivalent-work Each computed harmonic sine and cosine serves both coordinates and their derivatives; no cross-call cache is owned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Evaluation returns four numbers; projection returns O(K) coefficients and retains no input or global buffer.
 */
export namespace AutoMovieHarmonicCurve {
  /**
   * Number of coefficients of one coordinate series of the given order.
   *
   * @evidence contracts/common.md#principled-implementation One constant and one sine/cosine pair per harmonic give 2K+1 entries for a nonnegative integer order.
   * @evidence contracts/common.md#clear-and-simple-design The layout arithmetic lives beside the series readers that use its offset.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns the supplied order's width without rounding or choosing a consumer-specific order; validation belongs to the producer.
   * @evidence contracts/common.md#meaningful-documentation Identifies a single coordinate block rather than the two-coordinate array's total size.
   * @evidence contracts/performance.md#efficient-algorithms One multiplication and addition take constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar layout calculation coordinates no phases or requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returning a number retains no state or handle.
   */
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
   *
   * @evidence contracts/common.md#principled-implementation Evaluates the declared finite Fourier sum and its analytic phase derivative; the producer supplies K complete coefficient pairs in each block.
   * @evidence contracts/common.md#clear-and-simple-design Values and first derivatives share one harmonic loop and one four-number result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the coefficients' own derivatives without sampled differences, clipping or shape-specific terms.
   * @evidence contracts/common.md#meaningful-documentation Gives the coefficient layout, harmonic count, phase units and returned derivative units.
   * @evidence contracts/performance.md#efficient-algorithms O(K) arithmetic and two trigonometric calls per harmonic, with O(1) working storage; no recurrence or measured speedup is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work Each sine/cosine pair contributes to both coordinate values and derivatives in that iteration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the caller-owned four-number tuple escapes; coefficients are read without mutation or retention.
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
   *
   * @evidence contracts/common.md#principled-implementation Uniform phases with N>2K make the Fourier columns orthogonal, so their direct weighted projections solve the stated least-squares problem up to floating-point summation.
   * @evidence contracts/common.md#clear-and-simple-design The two coordinate blocks accumulate together instead of constructing a general normal-equation solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects too few samples; uniform phase spacing and a valid nonnegative integer order remain caller premises rather than inferred geometry.
   * @evidence contracts/common.md#meaningful-documentation States uniform sample phases, the orthogonality premise and the coefficient units/layout.
   * @evidence contracts/performance.md#efficient-algorithms O(NK) direct projection and O(K) output avoid a dense matrix; no FFT or optimality for arbitrarily large K is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work A sample's weighted sine/cosine serves both coordinates; completed projections are returned for the caller to reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one 2(2K+1)-entry output; no sample or transform state remains in this module.
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
