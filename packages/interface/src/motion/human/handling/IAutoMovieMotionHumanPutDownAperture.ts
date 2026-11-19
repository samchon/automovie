import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A held object placed through an authored opening into a seat.
 *
 * The opening and seat are two affordances on a stationary receptacle. Their
 * rotations match and their origins delimit an author-cleared straight path.
 * The selected prop socket, or its origin, reaches the opening at aperture,
 * the seat at placed, and stays mounted while the hand opens until release.
 * The motion law checks these frames and arm reach at both endpoints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the prop, its attachment point, the two receiver frames and the event that transfers ownership.
 * @evidence contracts/development/design.md#principled-representation Both targets are affordance ids on one stationary prop and share an orientation for a straight passage.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered putDownAperture law reads this input without extending the inherited placement schema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Identifies authored affordances instead of presuming prop kinds, dimensions or collision-free geometry.
 */
export interface IAutoMovieMotionHumanPutDownAperture {
  /** The held object's scene subject id. */
  prop: string;

  /** The holding hand. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;

  /** The receiving prop and both of its affordance ids. */
  onto: {
    /** The receptacle's scene subject id. */
    prop: string;

    /** Affordance at the opening where the object finishes its approach. */
    aperture: string;

    /** Affordance at the seated frame where the object mounts. */
    point: string;

    /** The held object's matching affordance. Defaults to its origin. */
    via?: string;
  };
}
