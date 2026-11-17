import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Gravity's one owner: the standard acceleration of gravity every law,
 * solver and default reads, so a fall, a launch, a flight and a pendulum
 * fall under the same value.
 *
 * The value is the standard acceleration of gravity, 9.80665 m/s² exactly,
 * as the 3rd General Conference on Weights and Measures (CGPM, 1901)
 * declared it and ISO 80000-3 states it. It acts along the canonical
 * frame's -Y, whose up is +Y.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its source, its unit and its direction.
 * @evidence contracts/development/design.md#principled-representation A defined constant of the SI's own vocabulary, held once, and its vector in the canonical frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the magnitude and the vector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No rounded copy: every reader takes the defined value from here.
 */
export namespace AutoMovieGravity {
  /** The standard acceleration of gravity, m/s²: 9.80665 exactly (3rd CGPM, 1901; ISO 80000-3). */
  export const STANDARD: number = 9.80665;

  /** Standard gravity as a world vector, m/s², along the canonical frame's -Y. */
  export const DOWN: Readonly<IAutoMovieVector3> = {
    x: 0,
    y: -STANDARD,
    z: 0,
  };
}
