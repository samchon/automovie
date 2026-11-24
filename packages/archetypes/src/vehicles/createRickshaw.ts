import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartDrawn } from "./CartDrawn";
import type { createCart } from "./createCart";

/**
 * Pedestrian-drawn rickshaw.
 *
 * Its shaft handles lead along +Z from the axle centre. The passenger sits over
 * the axle with a separate footboard.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createRickshaw(
  params: createRickshaw.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createRickshaw.Affordance, createRickshaw.Dimension> {
  return CartConstruction("rickshaw", params, seed, CartDrawn.rickshaw);
}

/** Authoring options for {@link createRickshaw}. */
export namespace createRickshaw {
  /** The `model` choices this producer admits. */
  export type Model = "edo89210382" | "edo90360001" | "powerhouse245268";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "gripHeight"
    | "length"
    | "mass"
    | "wheelDiameter"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds coupling, footboard, leftShaft, leftSpin, rightShaft, rightSpin,
   * seat.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createCart.IParams,
    "id" | "wheelDiameter" | "gripHeight" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }
}
