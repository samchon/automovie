/**
 * The radial profile shared by the trunk's features: the height over a
 * normalised radius `rho`, 1 at the feature's centre and 0 from `rho = 1`
 * outward, with its slope and curvature vanishing at the rim.
 *
 * `(1 - rho^2)^3` has value, first and second derivatives all zero at
 * `rho = 1`, so a feature built on it meets the wall it stands on with C2
 * contact, which is the contract of a relief window's edge (J7). Its slope at
 * the centre is zero (a rounded apex) and it falls fastest where `rho` is
 * about 0.4. Each feature supplies its own footprint, which maps a point of
 * the wall to its `rho`, so a short side of the footprint is steeper than a
 * long one with the same profile.
 */
export namespace AutoMovieHumanTrunkFeatureProfile {
  /**
   * The unit profile.
   *
   * @param rho Normalised radius, at least 0.
   * @returns Height share in [0, 1].
   */
  export function bump(rho: number): number {
    return rho >= 1 ? 0 : (1 - rho * rho) ** 3;
  }

  /**
   * A dome's unit profile: `(1 - rho^2)^3 (1 + a rho^2)`, which meets the
   * wall at `rho = 1` with the same C2 contact as {@link bump} and whose apex
   * has the curvature of the spherical cap standing on the same base with the
   * same height. Along a radius `b` a height `h` gives the apex the curvature
   * `2 h (3 - a) / b^2`, the cap's is `2 h / (b^2 + h^2)`, so
   * `a = 3 - 1 / (1 + aspect^2)` with `aspect = h / b`; `a` lies in `[2, 3)`,
   * where the profile falls monotonically. {@link bump}'s apex is three times
   * as sharp as a flat cap's, which reads as a cone once the height grows.
   *
   * @param rho Normalised radius, at least 0.
   * @param aspect The feature's height over its base radius.
   * @returns Height share in [0, 1].
   */
  export function dome(rho: number, aspect: number): number {
    if (rho >= 1) return 0;

    const x: number = rho * rho;
    const a: number = 3 - 1 / (1 + aspect * aspect);

    return (1 - x) ** 3 * (1 + a * x);
  }

  /**
   * A footprint of two half ellipses sharing a lateral half width: the
   * normalised radius of a point at `(u, v)` from the footprint's centre,
   * the lower half ellipse reaching `lower` below it and the upper one
   * `upper` above.
   *
   * @param u Lateral place from the centre, mm.
   * @param v Place along up from the centre, mm.
   * @param half Lateral half width, mm.
   * @param lower Reach below the centre, mm.
   * @param upper Reach above the centre, mm.
   * @returns The normalised radius.
   */
  export function rho(u: number, v: number, half: number, lower: number, upper: number): number {
    return Math.hypot(u / half, v < 0 ? -v / lower : v / upper);
  }
}
