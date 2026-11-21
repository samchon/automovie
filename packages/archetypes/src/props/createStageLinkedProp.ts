import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { StageShaftConstruction } from "./StageShaftConstruction";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/**
 * Padded linked stage ornament.
 *
 * A shaft and visibly jointed distal ornament with a grip, hinge, and following end mark.
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
export function createStageLinkedProp(
  params: createStageLinkedProp.IParams = {},
  seed?: number | string,
): Archetype<
  createStageLinkedProp.Affordance,
  createStageLinkedProp.Dimension
> {
  return StageShaftConstruction(
    "linked",
    params,
    seed,
    0.5,
    (builder, height, shaftTop, shaftRadius) => {
      const v: typeof Vector3.create = Vector3.create;
      const pivot: IAutoMovieVector3 = v(0, shaftTop, 0);
      const radius: number = 0.11 * height;
      const centre: IAutoMovieVector3 = v(0, height - radius, 0);
      builder.rod("connector", 0.32 * shaftRadius, pivot, centre, {
        color: "#bca6df",
      });
      builder.ball("ornament", radius, centre, { color: "#968ccc" });

      // The hinge turns about frame-local +Y, which faces out of the stage outline.
      builder.affordance({
        id: "link",
        kind: "hinge",
        frame: ArchetypeFrame.facing(pivot, v(0, 0, 1), v(1, 0, 0)),
        extent: null,
        travel: 180,
        parts: ["connector", "ornament"],
      });
      builder.affordance({
        id: "end",
        kind: "surface",
        direction: "along",
        frame: ArchetypeFrame.upright(v(0, height, 0)),
        extent: null,
        rides: "link",
      });
    },
  );
}

/**
 * Authoring options for {@link createStageLinkedProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageLinkedProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This producer builds end, grip, link.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;
}
