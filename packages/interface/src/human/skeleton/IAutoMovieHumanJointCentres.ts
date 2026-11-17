import type { IAutoMovieHumanSkeletonLaw } from "../generation/IAutoMovieHumanSkeletonLaw";

/** Type contracts exchanged by AutoMovieHumanJointCentres; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanJointCentres {
  /** One joint: a bone's origin, parent, segment direction and girth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One joint: a bone's origin, parent, segment direction and girth.
   * @evidence contracts/development/design.md#principled-representation `radius`: Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi at its middle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanJointCentres.derive. Read by AutoMovieHumanJointTurn.derive, AutoMovieHumanNeutral.frames, AutoMovieHumanNeutral.derive. Also types AutoMovieHumanBindingInputs.joints, AutoMovieHumanJointTurn.standing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `radius`; callers supply the complete record.
   */
  export interface IJoint extends IAutoMovieHumanSkeletonLaw.IBone {
    /** Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi at its middle. */
    radius: number;
  }
}
