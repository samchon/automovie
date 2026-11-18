import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A one-handed greeting that lifts and reseats a hat already worn on this
 * performer's head. Register `tipHat` as a law and pass these parameters.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the selected prop, available hand and promised result.
 * @evidence contracts/development/design.md#principled-representation A scene prop id and anatomical side select the object and effector. The law derives travel and timing from the body's dimensions and the prop's affordances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `tipHat.plan` reads both fields and owns the fit and worn-frame admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical human side and takes an actual prop id with authored grip and wear sockets.
 */
export interface IAutoMovieMotionHumanTipHat {
  /** The scene id of the hat declared worn on the performer's head. */
  prop: string;

  /** The free hand that takes the brim. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;
}
