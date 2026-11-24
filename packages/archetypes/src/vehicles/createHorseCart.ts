import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartDrawn } from "./CartDrawn";
import { CartFit } from "./CartFit";
import type { createCart } from "./createCart";

/**
 * Horse-drawn two-wheeled cart.
 *
 * The axle crosses X at the origin. The coupling is ahead along +Z. The seat,
 * footboard and driving-line contacts move with the cart.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createHorseCart(
  params: createHorseCart.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createHorseCart.Affordance, createHorseCart.Dimension> {
  return CartConstruction(
    "cart",
    params,
    seed,
    CartDrawn.cart,
    CartFit.harness,
  );
}

/** Authoring options for {@link createHorseCart}. */
export namespace createHorseCart {
  /** The `model` choices this producer admits. */
  export type Model = "multiUse" | "dennettGig";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
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
   * The createCart contact set its shared construction types. This producer
   * builds coupling, footboard, leftLine, leftLineEnd, leftLineGrip, leftSpin,
   * rightLine, rightLineEnd, rightLineGrip, rightSpin, seat.
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
