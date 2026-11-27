import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Gravity's one owner: the standard acceleration of gravity every law, solver
 * and default reads, so a fall, a launch, a flight and a pendulum fall under
 * the same value.
 *
 * The value is the standard acceleration of gravity, 9.80665 m/s² exactly, as
 * the 3rd General Conference on Weights and Measures (CGPM, 1901) declared it
 * and ISO 80000-3 states it. It acts along the canonical frame's -Y, whose up
 * is +Y.
 */
export namespace AutoMovieEngineGravity {
  /**
   * The standard acceleration of gravity, m/s²: 9.80665 exactly (3rd CGPM,
   * 1901; ISO 80000-3).
   */
  export const STANDARD: number = 9.80665;

  /** Standard gravity as a world vector, m/s², along the canonical frame's -Y. */
  export const DOWN: Readonly<IAutoMovieVector3> = {
    x: 0,
    y: -STANDARD,
    z: 0,
  };
}
