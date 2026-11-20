import { type Archetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartDrawn } from "./CartDrawn";
import type { createCart } from "./createCart";

/**
 * Two-wheeled standing chariot.
 *
 * The pole coupling leads along +Z from the axle. The platform and rail support standing performers.
 *
 * @param params The scene identity and the dimensions and catalogue choices this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the carrier's orientation and working contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's geometry and actor-facing supports use CartDrawn.chariot with the shared cart draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Passes the selected geometry owner to CartConstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createChariot(
  params: createChariot.IParams = {},
  seed?: number | string,
): Archetype<createCart.Affordance, createCart.Dimension> {
  return CartConstruction("chariot", params, seed, CartDrawn.chariot);
}

/**
 * Authoring options for {@link createChariot}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createChariot {
  /** The model identity, dimensions and this form's catalogue choices. */
  export type IParams = Pick<
    createCart.IParams,
    | "id"
    | "wheelDiameter"
    | "track"
    | "floorWidth"
    | "floorDepth"
    | "railHeight"
    | "poleLength"
    | "withersHeight"
    | "mass"
  > & {
    /** A model from this form's catalogue. */
    model?:
      | "carter120"
      | "carter121"
      | "carter122"
      | "carter161"
      | "carter332"
      | "carter333";
  };
}
