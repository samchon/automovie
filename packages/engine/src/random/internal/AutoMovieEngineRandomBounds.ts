/*
 * Domain limits for the Engine's deterministic gradient-noise lattices.
 */
export namespace AutoMovieEngineRandomBounds {
  /*
   * Largest admitted 2D lattice coordinate magnitude, cells.
   */
  export const GRADIENT_NOISE_2: number = 33_554_432;

  /*
   * Largest admitted 3D lattice coordinate magnitude, cells.
   */
  export const GRADIENT_NOISE_3: number = 65_536;
}
