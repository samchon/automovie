import { type Archetype } from "../core";
import { CartridgeBox } from "./CartridgeBox";
import { StageCarrierConstruction } from "./StageCarrierConstruction";
import type { createHolster } from "./createHolster";

/**
 * Worn stage pouch.
 *
 * A costume box with a separately articulated lid, belt or strap hooks and individually addressed display-token sites.
 *
 * @param params The scene id, optional display dimensions and this carrier's own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the wearable model origin and the model-space stage contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original silhouette geometry and the costume contact required by this form.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves a model through shared carrier admission, then builds only this shape and its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStagePouch(
  params: createStagePouch.IParams = {},
  seed?: number | string,
): Archetype<createStagePouch.Affordance, createStagePouch.Dimension> {
  return StageCarrierConstruction(
    "pouch",
    params,
    seed,
    (builder, d, slots) => {
      CartridgeBox.lay(
        builder,
        d,
        slots,
        StageCarrierConstruction.facingWearer,
      );
    },
  );
}

/**
 * Authoring options for {@link createStagePouch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStagePouch {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "length" | "mass" | "thickness" | "width";

  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "belt" | "lid" | "strap" | `slot${number}`;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createHolster.IParams,
    "id" | "length" | "thickness" | "depth" | "width" | "mass"
  >;
}
