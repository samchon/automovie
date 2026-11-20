import { type Archetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Heavy round display silhouette.
 *
 * A round, floor-supported stage form with its model-space two-hand contact at the centre.
 *
 * @param params The scene id and this digital form's catalogue or sizing options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the inert display form and its actor contact.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing stage form's actual visible silhouette and model-space contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the selected mesh and contact once with the shared draw.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageRoundProp(
  params: createStageRoundProp.IParams = {},
  seed?: number | string,
): Archetype<createProjectile.Affordance, createProjectile.Dimension> {
  return StageTokenConstruction(
    "roundShot",
    params,
    seed,
    (builder, d, model) => stageTokenSphere(builder, d, "roundShot", model),
  );
}

/**
 * Authoring options for {@link createStageRoundProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageRoundProp {
  /** The model identity and this form's catalogue choices. */
  export type IParams = Pick<createProjectile.IParams, "id"> & {
    /** A model from this form's catalogue. */
    model?: "sixPounder" | "twelvePounder";
  };
}
