import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { StageShaftConstruction } from "./StageShaftConstruction";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/**
 * Padded round-headed stage prop.
 *
 * A display form with a round ornament above a one-hand shaft grip. Its origin is at the shaft base.
 *
 * @param params The scene identity and optional total display height in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this inert form's silhouette and actor-facing display contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Uses this form's authored ornament, grip and any articulated or fixed display contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the common shaft and adds only the chosen silhouette's visible assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageMaceProp(
  params: createStageMaceProp.IParams = {},
  seed?: number | string,
): Archetype<createStageMaceProp.Affordance, createStageMaceProp.Dimension> {
  return StageShaftConstruction(
    "mace",
    params,
    seed,
    0.8,
    (builder, height) => {
      const v: typeof Vector3.create = Vector3.create;
      const radius: number = 0.115 * height;
      builder.ball("ornament", radius, v(0, height - radius, 0), {
        color: "#968ccc",
      });
    },
  );
}

/**
 * Authoring options for {@link createStageMaceProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageMaceProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This producer builds grip.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;
}
