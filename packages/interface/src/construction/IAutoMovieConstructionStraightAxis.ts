import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A straight axis: the section plane at station 0, moved along its normal `v x u` by the station.
 *
 * Engine admission: `u` and `v` unit and square to each other.
 *
 * @evidence contracts/common.md#principled-implementation A part straight in its bone frame at its neutral pose has one plane moved along one direction, so every station's plane follows from the first.
 * @evidence contracts/common.md#clear-and-simple-design An origin and two axes fix the whole frame; the station direction is their product, not a third field that could disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-unit or non-square axes are refused rather than normalised, since a silent fix would move every outline.
 * @evidence contracts/common.md#meaningful-documentation States the station direction, the metre origin and the axes' admission.
 */
export interface IAutoMovieConstructionStraightAxis {
  /** Discriminator. */
  type: "straight";

  /** The axis point at station 0, metres in the construction's frame. */
  origin: IAutoMovieVector3;

  /** The chart's first axis, the direction of a section's polar angle 0, unit. */
  u: IAutoMovieVector3;

  /** The chart's second axis, the direction of polar angle `pi / 2`, unit and square to `u`. */
  v: IAutoMovieVector3;
}
