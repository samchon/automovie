import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Contacts for a grounded step vault. The named hand and opposite foot
 * support the crossing while the foot on the hand's side passes between
 * them. The supporting foot then follows to the exit. Give fixed targets
 * with enough room for the ordinary support-sequence swing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact sequence, side convention and which choreography the targets support.
 * @evidence contracts/development/design.md#principled-representation The side selects the paired palm and opposite foot. Separate entry, crossing and exit targets describe their physical locations in each authored frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `stepVaultSupport` reads each target in the stance where that contact bears, and the side chooses which leg moves through first.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the human side and motion target contracts. The route's coordinates and stances remain independent of body dimensions.
 */
export interface IAutoMovieMotionHumanStepVault {
  /** The supporting hand. The foot on this same side crosses first. */
  hand: AutoMovieHumanSide;

  /** Foot contacts on the approach side. */
  entry: IAutoMovieMotionHumanStepVault.IFeet;

  /** The fixed support for the selected palm. */
  palm: IAutoMovieMotionHumanStepVault.Target;

  /** The fixed support for the opposite foot while the first foot crosses. */
  step: IAutoMovieMotionHumanStepVault.Target;

  /** Foot contacts on the exit side. */
  exit: IAutoMovieMotionHumanStepVault.IFeet;
}

/**
 * Targets on the fixed surfaces that support a step vault.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact-location contracts used by the route.
 * @evidence contracts/development/design.md#principled-representation A support location is a fixed point or a prop's named point, paired by anatomical side for a two-foot stance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the two route-specific target declarations alongside the route type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses existing motion targets to represent positions and frames.
 */
export namespace IAutoMovieMotionHumanStepVault {
  /**
   * A fixed prop's named contact or a fixed point in metres in the
   * indicated frame. The support action resolves it at entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the variants, units, frame and time of resolution.
   * @evidence contracts/development/design.md#principled-representation The motion target discriminant preserves either a named prop contact or a spatial point and its frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The route and its footprints share the same support target projection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the shared target union and admits only physical point variants.
   */
  export type Target = Extract<
    IAutoMovieMotionTarget,
    { kind: "prop" | "point" }
  >;

  /**
   * The pair of places where the feet bear at one end of the crossing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where this pair applies and what it represents.
   * @evidence contracts/development/design.md#principled-representation Each required member supplies one of the two distinct foot contacts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `stepVaultSupport` reads both sides for the entry and exit stances.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The same pair type handles both ends and either choice of supporting hand.
   */
  export interface IFeet {
    /** Where the left foot bears. */
    left: IAutoMovieMotionHumanStepVault.Target;

    /** Where the right foot bears. */
    right: IAutoMovieMotionHumanStepVault.Target;
  }
}
