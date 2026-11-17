import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";

/** Type contracts exchanged by AutoMovieHumanHandHeel; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandHeel {
  /** A heel's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A heel's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `form`: The hand form, shared by every person. `map`: The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist. `bone`: The bone tube's point at a station `a` of the hand's axis and a phase `t` of the arm's section, left frame, mm: the arm's cut, or the wrist span's end section copied (the heel starts from it).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandHeel.point, AutoMovieHumanHandHeel.creaseJet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `form`, `map`, `bone`; callers supply the complete record.
   */
  export interface IInput {
    /** The hand form, shared by every person. */
    form: IAutoMovieHumanHandForm;

    /** The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist. */
    map: (q: readonly [number, number, number]) => AutoMovieVector3Tuple;

    /**
     * The bone tube's point at a station `a` of the hand's axis and a phase
     * `t` of the arm's section, left frame, mm: the arm's cut, or the wrist
     * span's end section copied (the heel starts from it).
     */
    bone: (a: number, t: number) => AutoMovieVector3Tuple;
  }
}
