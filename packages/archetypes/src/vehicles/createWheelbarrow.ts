import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartPushed } from "./CartPushed";
import type { createCart } from "./createCart";

/**
 * Wheelbarrow.
 *
 * A hand-pushed tray with a central wheel and distinct left and right grips. It
 * rests on the floor with its handles at −Z.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createWheelbarrow(
  params: createWheelbarrow.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createWheelbarrow.Affordance,
  createWheelbarrow.Dimension
> {
  return CartConstruction("wheelbarrow", params, seed, CartPushed.wheelbarrow);
}

/** Authoring options for {@link createWheelbarrow}. */
export namespace createWheelbarrow {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "gripDiameter"
    | "handleHeight"
    | "handleSpacing"
    | "length"
    | "mass"
    | "wheelDiameter"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds leftHandle, load, rightHandle.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createCart.IParams,
    | "id"
    | "length"
    | "width"
    | "handleHeight"
    | "handleSpacing"
    | "gripDiameter"
    | "wheelDiameter"
    | "mass"
  >;
}
