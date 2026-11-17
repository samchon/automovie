import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/** Section and angular resolution for extracting a positive radial profile. */
export namespace IAutoMovieSampleSweepSection {
  /**
   * Sample a section's radius from its origin at evenly spaced polar angles.
   * 
   * Radius `k` lies along angle `2 pi k / count`, measured counterclockwise from
   * the section plane's `+x` axis. A radial section is read through its periodic
   * spline, `interpolateAutoMovieSpline`. A superellipse centred on its origin is read in
   * closed form: in the quadrant holding the angle, with that quadrant's
   * half-axes `a` along `x` and `b` along `y` and exponent `n`, the curve is
   * `|x / a|^n + |y / b|^n = 1`, so the radius is
   * `(|cos a / a|^n + |sin a / b|^n)^(-1/n)`, and it is star-shaped and
   * counterclockwise by construction. Any other curve is first walked at 64 points per
   * segment (at least 1,024) to bracket each angle between two curve parameters,
   * then the parameter is bisected forty times against the curve's own polar
   * angle, so the radius lies on the exact curve rather than on a chord.
   * 
   * The walk checks the sampled curve for star-shapedness about its origin and winding
   * counterclockwise: the polar angle must strictly increase between successive
   * points and turn once in total, or the curve is refused, because the sampled walk would not pair its points by direction.
   * This finite walk does not certify monotone polar angle between probes.
   *
   * @evidence contracts/development/design.md#principled-representation A section-plane metre curve is sampled at evenly spaced polar directions; the sampler checks count and authored data, with finite-walk admission for general curves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieSweep uses this radius array for direction correspondence, while parameter correspondence keeps its own Cartesian section evaluator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The finite walk is not a proof of unsampled star-shapedness; sampled radial spline values are checked for positive finiteness rather than clipped.
   * @evidence contracts/development/common.md#meaningful-documentation Gives angular convention, metre units, output cardinality, validation owner and the finite-walk limitation.
   */
  export type IProps = {
    /** Borrowed section in metre x/y coordinates. The sampler validates radial data or delegates curve admission to parameterizeAutoMovieSweepSection; its finite walk rejects observed origin crossings and nonincreasing polar angles, without certifying unsampled curve intervals. */
    section: IAutoMovieSweepSection;

    /** Safe integer angular sample count of at least three, checked by the sampler. Output has exactly this many newly allocated radii at 2*pi*k/count radians, with no repeated endpoint. */
    count: number;
  };
}
