/**
 * The lens glare kernel of `IAutoMovieFilmOptics.glare`: three Gaussians whose
 * standard deviations are fractions of the frame height and whose weights sum
 * to one.
 *
 * A fixed approximation of a lens point-spread function as Spencer, Shirley,
 * Zimmerman and Greenberg describe it ("Physically-based glare effects for
 * digital images", SIGGRAPH 1995): a narrow core that softens the edge of a
 * highlight, and wider skirts that veil the surrounding frame. The values are
 * the contract's, not fitted to any lens; at a 720-pixel frame the deviations
 * are 1.44, 7.2 and 36 pixels and the combined centre weight is 0.0470.
 */
export const AUTOMOVIE_FILM_GLARE_KERNELS: readonly {
  /** Standard deviation as a fraction of the frame height. */
  readonly sigma: number;

  /** Share of the spread energy, the three summing to one. */
  readonly weight: number;
}[] = [
  { sigma: 0.002, weight: 0.6 },
  { sigma: 0.01, weight: 0.3 },
  { sigma: 0.05, weight: 0.1 },
];
