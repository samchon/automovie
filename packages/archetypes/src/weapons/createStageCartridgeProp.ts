import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";

/**
 * Paper cylinder stage silhouette.
 *
 * A display cylinder with a precision hand contact at mid-height and an end mark along +Y.
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
export function createStageCartridgeProp(
  params: createStageCartridgeProp.IParams = {},
  seed?: number | string,
): Archetype<createProjectile.Affordance, createProjectile.Dimension> {
  return StageTokenConstruction("cartridge", params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    const r: number = d.diameter! / 2;
    builder.rod("paper", r, v(0, 0, 0), v(0, d.length!, 0), {
      color: "#d8cfb8",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, d.length! / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: d.diameter!,
    });
    builder.affordance({
      id: "end",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, d.length!, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  });
}

/**
 * Authoring options for {@link createStageCartridgeProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageCartridgeProp {
  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;
}
