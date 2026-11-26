import type { AutoMovieArchetype } from "../core";
import type { createCart } from "./createCart";
import { createWheelbarrowImpl } from "./cart/createWheelbarrow";

/** Canonical producer and authoring contract for Wheelbarrow. */
export namespace AutoMovieArchetypeWheelbarrow {
  /**
   * Wheelbarrow.
   *
   * A hand-pushed tray with a central wheel and distinct left and right grips. It
   * rests on the floor with its handles at ?뭒.
   *
   * @param params The scene identity and the dimensions and catalogue choices
   *   this carrier admits.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(
    params: AutoMovieArchetypeWheelbarrow.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeWheelbarrow.Affordance,
    AutoMovieArchetypeWheelbarrow.Dimension
  > {
    return createWheelbarrowImpl(params, seed);
  }

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
