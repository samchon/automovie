import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";
import { createHorseCart } from "./cart/createHorseCart";

/** Canonical producer and authoring contract for Horse Cart. */
export namespace AutoMovieArchetypeHorseCart {
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
  export function create(
    params: AutoMovieArchetypeHorseCart.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeHorseCart.Affordance,
    AutoMovieArchetypeHorseCart.Dimension
  > {
    return createHorseCart(params, seed);
  }

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
  export type Affordance = AutoMovieArchetypeCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeCart.IParams,
    "id" | "track" | "clearance" | "seatHeight" | "withersHeight" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
    /** A measured shaft option for the selected cart. */
    shaft?: AutoMovieArchetypeCart.Shaft;
  }
}
