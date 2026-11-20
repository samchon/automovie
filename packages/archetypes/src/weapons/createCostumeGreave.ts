import { type Archetype } from "../core";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

/**
 * Worn lower-leg costume.
 *
 * A hollow costume shell registered to a lower-leg segment by the wear frame.
 *
 * @param params The scene id and optional measurements and model choice of this costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this independent costume form and what supports it.
 * @evidence contracts/development/implementation.md#principled-implementation Separates this costume cell generator from the common museum record and optional body fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves the sourced dimensions and invokes the owning hollow-form builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createCostumeGreave(
  params: createCostumeGreave.IParams = {},
  seed?: number | string,
): Archetype<createArmour.Affordance, createArmour.Dimension> {
  return CostumeConstruction("greave", params, seed, ArmourLimb);
}

/**
 * Authoring options for {@link createCostumeGreave}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createCostumeGreave {
  /** The model identity, dimensions and this form's catalogue choices. */
  export type IParams = Pick<
    createArmour.IParams,
    "id" | "thickness" | "measure"
  > & {
    /** A model from this form's catalogue. */
    model?: "met22970" | "met22276";
  };
}
