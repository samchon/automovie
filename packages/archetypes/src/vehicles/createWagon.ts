import { type Archetype } from "../core";
import { CartCoach } from "./CartCoach";
import { CartConstruction } from "./CartConstruction";
import type { createCart } from "./createCart";

/**
 * Four-wheeled wagon.
 *
 * The rear axle crosses X at the origin. The front axle steers the pole and the bed supports freight.
 *
 * @param params The scene identity and the dimensions and catalogue choices this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the carrier's orientation and working contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's geometry and actor-facing supports use CartCoach.wagon with the shared cart draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Passes the selected geometry owner to CartConstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createWagon(
  params: createWagon.IParams = {},
  seed?: number | string,
): Archetype<createWagon.Affordance, createWagon.Dimension> {
  return CartConstruction("wagon", params, seed, CartCoach.wagon);
}

/**
 * Authoring options for {@link createWagon}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createWagon {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "bedDepth"
    | "frontWheelDiameter"
    | "length"
    | "mass"
    | "poleLength"
    | "track"
    | "wheelDiameter"
    | "wheelbase"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer builds bed, coupling, drawbarPitch, frontAxle, frontLeftSpin, frontRightSpin, rearLeftSpin, rearRightSpin.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createCart.IParams,
    | "id"
    | "frontWheelDiameter"
    | "wheelDiameter"
    | "track"
    | "wheelbase"
    | "poleLength"
    | "length"
    | "width"
    | "bedDepth"
    | "mass"
  >;
}
