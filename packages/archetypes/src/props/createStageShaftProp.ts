import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeDraw } from "../core";
import { StageShaftConstruction } from "./StageShaftConstruction";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/**
 * Padded shaft stage prop.
 *
 * A digital upright shaft with a solid padded outline and one primary grip for actor posing.
 *
 * @param params The scene identity and optional total display height in metres, with a choice of profile.
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
export function createStageShaftProp(
  params: createStageShaftProp.IParams,
  seed?: number | string,
): Archetype<
  createStageWeaponProp.Affordance,
  createStageWeaponProp.Dimension
> {
  const kind: createStageShaftProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    createStageShaftProp.KINDS,
  );
  return StageShaftConstruction(kind, params, seed, 0.8, (builder, height) => {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = (kind === "shuo" ? 0.052 : 0.027) * height;
    const lower: number = (kind === "shuo" ? 0.68 : 0.78) * height;
    builder.rod("ornament", radius, v(0, lower, 0), v(0, height - radius, 0), {
      color: "#968ccc",
      round: true,
    });
    if (kind === "halberd")
      builder.rod(
        "sideOrnament",
        0.058 * height,
        v(0, 0.83 * height, 0),
        v(0.15 * height, 0.8 * height, 0),
        { color: "#bca6df", round: true },
      );
  });
}

/**
 * Authoring options for {@link createStageShaftProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form and names only the profiles sharing its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageShaftProp {
  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["pike", "shuo", "halberd"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height"> & {
    /** The profile with the required outline. */
    kind: Kind;
  };
}
