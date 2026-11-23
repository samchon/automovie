/**
 * The quintic fade `6t^5 - 15t^4 + 10t^3` that blends the lattice corners of
 * gradient noise (Perlin 2002, "Improving Noise", ACM Transactions on Graphics
 * 21(3)).
 *
 * It rises from 0 at `t = 0` to 1 at `t = 1` with zero first and second
 * derivatives at both ends, so noise blended by it is continuous with
 * continuous first and second derivatives across cell faces. It is symmetric,
 * `fade(1 - t) = 1 - fade(t)`, and lies at or below `t` on `[0, 1/2]`, which
 * the single-octave bound of `createAutoMovieGradientNoise2` and
 * `createAutoMovieGradientNoise3` uses.
 *
 * @param t Position inside a lattice cell along one axis, in [0, 1].
 * @returns The corner blend weight of the far corner, in [0, 1].
 */
export function fadeAutoMovieGradientNoise(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
