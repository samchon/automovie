import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { StageBladeConstruction } from "./StageBladeConstruction";
import type { createStageBladeProp } from "./createStageBladeProp";

/**
 * Padded two-handed sword silhouette.
 *
 * A long padded silhouette with a visible crossguard and a two-hand grip extending along +Y from the model origin.
 *
 * @param params The scene identity and optional display length in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the capped digital prop and its hand contact.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the shared capped display shaft with a form-owned guard and an explicit actor hand contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fits this form's visible details around a common length and shaft.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageTwoHandedSwordProp(
  params: createStageTwoHandedSwordProp.IParams = {},
  seed?: number | string,
): Archetype<
  createStageTwoHandedSwordProp.Affordance,
  createStageTwoHandedSwordProp.Dimension
> {
  return StageBladeConstruction(
    "longsword",
    params,
    seed,
    true,
    (builder, { gripLength, guardRadius, guardDepth }) => {
      const v: typeof Vector3.create = Vector3.create;
      builder.rod(
        "guard",
        guardDepth,
        v(-guardRadius, gripLength, 0),
        v(guardRadius, gripLength, 0),
        { color: "#6f6687", round: true },
      );
    },
  );
}

/**
 * Authoring options for {@link createStageTwoHandedSwordProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageTwoHandedSwordProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length";

  /** The stage blades' shared contacts; this producer builds the grip and the point and declares no edge. */
  export type Affordance = createStageBladeProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageBladeProp.IParams, "id" | "length">;
}
