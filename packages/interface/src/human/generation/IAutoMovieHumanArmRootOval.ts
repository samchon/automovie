import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";

/**
 * Type contracts exchanged by AutoMovieHumanArmRootOval; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanArmRootOval exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanArmRootOval; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanArmRootOval {
  /** What the oval reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the oval reads.
   * @evidence contracts/development/design.md#principled-representation `glenohumeral`: The glenohumeral centre `[x, y, z]`, mm. `radius`: The upper arm's girth radius, mm: the biceps tape over 2 pi. `cap`: The cap's outline from the centre's height to the shoulder point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmRootOval.at, AutoMovieHumanArmRootOval.outline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `glenohumeral`, `radius`, `cap`; callers supply the complete record.
   */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;

    /** The cap's outline from the centre's height to the shoulder point. */
    cap: IAutoMovieHumanShoulderOutline;
  }
}
