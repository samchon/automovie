/**
 * One baked irradiance probe: the irradiance a receiver at the probe's point
 * gets from every direction, as order-2 spherical harmonics already convolved
 * with the clamped cosine (Ramamoorthi and Hanrahan 2001).
 *
 * `coefficients` holds nine RGB triples, 27 numbers, in the band order (l, m) =
 * (0, 0), (1, −1), (1, 0), (1, 1), (2, −2), (2, −1), (2, 0), (2, 1), (2, 2),
 * each triple red, green, blue. The irradiance in lux of a receiver facing the
 * world unit direction `n = (x, y, z)` is `Σ c_lm Y_lm(n)` with the real basis
 * 0.282095; 0.488603 y, z, x; 1.092548 xy, yz; 0.315392 (3z² − 1); 1.092548 xz;
 * 0.546274 (x² − y²). `autoMovieIrradianceOf` evaluates it.
 */
export interface IAutoMovieIrradianceProbe {
  /** Nine RGB irradiance coefficients, lux, in band order. */
  coefficients: number[];

  /**
   * Whether the probe lies in open space: false when more than a quarter of its
   * cube's texels see back faces, which puts it inside a solid.
   */
  valid: boolean;
}
