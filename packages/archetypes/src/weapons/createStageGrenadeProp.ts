import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Rounded period stage silhouette.
 *
 * The ornamental top and round body are an inert digital model with a single actor grip at the body's centre.
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
export function createStageGrenadeProp(
  params: createStageGrenadeProp.IParams = {},
  seed?: number | string,
): Archetype<
  createStageGrenadeProp.Affordance,
  createStageGrenadeProp.Dimension
> {
  return StageTokenConstruction(
    "grenade",
    params,
    seed,
    (builder, d, model) => {
      const v: typeof Vector3.create = Vector3.create;
      const top: number = d.length!;
      builder.rod(
        "fuze",
        d.diameter! * createProjectile.FUZE,
        v(0, d.diameter!, 0),
        v(0, top, 0),
        { color: "#3f4a3a" },
      );
      return stageTokenSphere(builder, d, "grenade", model);
    },
  );
}

/**
 * Authoring options for {@link createStageGrenadeProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageGrenadeProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "body";

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;
}
