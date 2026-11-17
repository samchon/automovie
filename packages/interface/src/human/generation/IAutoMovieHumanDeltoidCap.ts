import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";

/**
 * Type contracts exchanged by AutoMovieHumanDeltoidCap; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanDeltoidCap exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOval, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanDeltoidCap; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOval, IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanDeltoidCap {
  /** An ellipse in a horizontal plane.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An ellipse in a horizontal plane.
   * @evidence contracts/development/design.md#principled-representation `x`: Forward place of the centre, mm. `z`: Lateral place of the centre, mm. `rx`: Forward half size, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDeltoidCap.at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `z`, `rx`, `rz`; callers supply the complete record.
   */
  export interface IOval {
    /** Forward place of the centre, mm. */
    x: number;

    /** Lateral place of the centre, mm. */
    z: number;

    /** Forward half size, mm. */
    rx: number;

    /** Lateral half size, mm. */
    rz: number;
  }

  /** What the cap reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the cap reads.
   * @evidence contracts/development/design.md#principled-representation `glenohumeral`: The glenohumeral centre `[x, y, z]`, mm. `outline`: The cap's outline from the centre's height to the shoulder point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDeltoidCap.at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `glenohumeral`, `outline`; callers supply the complete record.
   */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The cap's outline from the centre's height to the shoulder point. */
    outline: IAutoMovieHumanShoulderOutline;
  }
}
