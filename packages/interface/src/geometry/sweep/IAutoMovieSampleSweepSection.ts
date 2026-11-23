import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/** Section and angular resolution for extracting a positive radial profile. */
export namespace IAutoMovieSampleSweepSection {
  /**
   * Sample a section's radius from its origin at evenly spaced polar angles.
   *
   * Radius `k` lies along angle `2 pi k / count`, measured counterclockwise
   * from the section plane's `+x` axis. A radial section is read through its
   * periodic spline, `interpolateAutoMovieSpline`. A superellipse centred on
   * its origin is read in closed form: in the quadrant holding the angle, with
   * that quadrant's half-axes `a` along `x` and `b` along `y` and exponent `n`,
   * the curve is `|x / a|^n + |y / b|^n = 1`, so the radius is `(|cos a / a|^n
   * + |sin a / b|^n)^(-1/n)`, and it is star-shaped and counterclockwise by
   * construction. Any other curve is first walked at 64 points per segment (at
   * least 1,024) to bracket each angle between two curve parameters, then the
   * parameter is bisected forty times against the curve's own polar angle, so
   * the radius lies on the exact curve rather than on a chord.
   *
   * The walk checks the sampled curve for star-shapedness about its origin and
   * winding counterclockwise: the polar angle must strictly increase between
   * successive points and turn once in total, or the curve is refused, because
   * the sampled walk would not pair its points by direction. This finite walk
   * does not certify monotone polar angle between probes.
   */
  export type IProps = {
    /**
     * Borrowed section in metre x/y coordinates. The sampler validates radial
     * data or delegates curve admission to parameterizeAutoMovieSweepSection;
     * its finite walk rejects observed origin crossings and nonincreasing polar
     * angles, without certifying unsampled curve intervals.
     */
    section: IAutoMovieSweepSection;

    /**
     * Safe integer angular sample count of at least three, checked by the
     * sampler. Output has exactly this many newly allocated radii at
     * 2_pi_k/count radians, with no repeated endpoint.
     */
    count: number;
  };
}
