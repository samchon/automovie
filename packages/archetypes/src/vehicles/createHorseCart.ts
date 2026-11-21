import { type Archetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartDrawn } from "./CartDrawn";
import { CartFit } from "./CartFit";
import type { createCart } from "./createCart";

/**
 * Horse-drawn two-wheeled cart.
 *
 * The axle crosses X at the origin. The coupling is ahead along +Z. The seat, footboard and driving-line contacts move with the cart.
 *
 * @param params The scene identity and the dimensions and catalogue choices this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the carrier's orientation and working contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's geometry and actor-facing supports use CartDrawn.cart with the shared cart draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Passes the selected geometry owner to CartConstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createHorseCart(
  params: createHorseCart.IParams = {},
  seed?: number | string,
): Archetype<createHorseCart.Affordance, createHorseCart.Dimension> {
  return CartConstruction(
    "cart",
    params,
    seed,
    CartDrawn.cart,
    CartFit.harness,
  );
}

/**
 * Authoring options for {@link createHorseCart}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createHorseCart {
  /** The `model` choices this producer admits. */
  export type Model = "multiUse" | "dennettGig";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "clearance"
    | "girth"
    | "mass"
    | "seatHeight"
    | "shaftLength"
    | "track"
    | "wheelDiameter"
    | "withersHeight";

  /**
   * The createCart contact set its shared construction types. This producer builds coupling, footboard, leftLine, leftLineEnd, leftLineGrip, leftSpin, rightLine, rightLineEnd, rightLineGrip, rightSpin, seat.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createCart.IParams,
    "id" | "track" | "clearance" | "seatHeight" | "withersHeight" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
    /** A measured shaft option for the selected cart. */
    shaft?: createCart.Shaft;
  }
}
