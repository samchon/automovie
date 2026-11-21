import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StageShaftConstruction } from "./StageShaftConstruction";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/**
 * Padded offset stage hammer.
 *
 * A digital asymmetrical block marks the visible face above one hand contact. Display height is along +Y.
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
export function createStageHammerProp(
  params: createStageHammerProp.IParams = {},
  seed?: number | string,
): Archetype<
  createStageHammerProp.Affordance,
  createStageHammerProp.Dimension
> {
  return StageShaftConstruction(
    "offsetHammer",
    params,
    seed,
    0.8,
    (builder, height) => {
      const v: typeof Vector3.create = Vector3.create;
      const width: number = 0.24 * height;
      const centre: number = 0.06 * height;
      builder.box(
        "ornament",
        v(width, 0.2 * height, 0.095 * height),
        v(centre, 0.9 * height, 0),
        { color: "#968ccc" },
      );
      builder.affordance({
        id: "face",
        kind: "surface",
        direction: "normal",
        frame: ArchetypeFrame.facing(
          v(centre + width / 2, 0.9 * height, 0),
          v(1, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
      });
    },
  );
}

/**
 * Authoring options for {@link createStageHammerProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageHammerProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height";

  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;
}
