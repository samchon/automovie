import { type AutoMovieArchetype } from "../core";
import { StageBowConstruction } from "./StageBowConstruction";
import { buildCrossbow } from "./buildCrossbow";
import type { createBow } from "./createBow";

/**
 * Stock-mounted bow silhouette for screen staging.
 *
 * A digital display model with a stock, visible spanning curve and posed actor contact marks.
 *
 * @param params The scene identity and optional dimensions for the display silhouette.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the stock model and its posed stage contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the stock silhouette and matched scene frames in the existing geometry owner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the existing stock-shape builder with the selected catalogue dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageStockBowProp(
  params: createStageStockBowProp.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createStageStockBowProp.Affordance,
  createStageStockBowProp.Dimension
> {
  return StageBowConstruction("crossbow", params, seed, buildCrossbow);
}

/**
 * Authoring options for {@link createStageStockBowProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageStockBowProp {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "brace" | "depth" | "length" | "mass";

  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance =
    | "butt"
    | "crank"
    | "foreEnd"
    | "grip"
    | "lowerLimb"
    | "nock"
    | "rail"
    | "rest"
    | "stirrup"
    | "string"
    | "trigger"
    | "upperLimb";

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createBow.IParams,
    "id" | "length" | "depth" | "brace" | "mass"
  >;
}
