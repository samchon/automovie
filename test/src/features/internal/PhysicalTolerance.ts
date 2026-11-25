/**
 * The tolerances the engine physics unit tests compare closed forms with, each
 * derived from what bounds the error it allows.
 */
export namespace PhysicalTolerance {
  /**
   * The rounding of a short chain of double-precision operations on values of
   * order one, unitless or in metres, seconds and radians: each IEEE 754
   * operation errs by at most half an ulp, about 1.1e-16 near 1, so a chain of
   * up to a few thousand operations stays under 1e-12.
   */
  export const ROUNDING: number = 1e-12;

  /**
   * The rounding accumulated over an integration, an iteration or a long sum on
   * values of order one: up to some ten million double operations at about
   * 1.1e-16 each stay under 1e-9.
   */
  export const ACCUMULATED: number = 1e-9;

  /**
   * What a converged solve leaves on its result, metres or radians: the engine's
   * iterative fits stop at a residual of 1e-6 or finer, so a converged value
   * agrees with its closed form to a micrometre.
   */
  export const CONVERGED: number = 1e-6;
}
