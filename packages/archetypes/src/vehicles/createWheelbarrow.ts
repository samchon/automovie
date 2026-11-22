import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartPushed } from "./CartPushed";
import type { createCart } from "./createCart";

/**
 * Wheelbarrow.
 *
 * A hand-pushed tray with a central wheel and distinct left and right grips. It rests on the floor with its handles at −Z.
 *
 * @param params The scene identity and the dimensions and catalogue choices this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the carrier's orientation and working contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's geometry and actor-facing supports use CartPushed.wheelbarrow with the shared cart draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Passes the selected geometry owner to CartConstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createWheelbarrow(
  params: createWheelbarrow.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createWheelbarrow.Affordance,
  createWheelbarrow.Dimension
> {
  return CartConstruction("wheelbarrow", params, seed, CartPushed.wheelbarrow);
}

/**
 * Authoring options for {@link createWheelbarrow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createWheelbarrow {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "gripDiameter"
    | "handleHeight"
    | "handleSpacing"
    | "length"
    | "mass"
    | "wheelDiameter"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer builds leftHandle, load, rightHandle.
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
