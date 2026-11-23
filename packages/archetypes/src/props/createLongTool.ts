import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";
import { createBroom } from "./createBroom";
import { createFishingRod } from "./createFishingRod";
import { createForestAxe } from "./createForestAxe";
import { createMop } from "./createMop";
import { createShovel } from "./createShovel";
import { createStageAtlatl } from "./createStageAtlatl";
import { createStageSling } from "./createStageSling";
import { createStageSpongeRammer } from "./createStageSpongeRammer";
import { createStageTrailHandspike } from "./createStageTrailHandspike";
import { createStageWorm } from "./createStageWorm";

/**
 * Read a saved long implement recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Read a saved long implement recipe and call the producer for its kind.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects the named producer that owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper validates the saved kind and hands off the input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kind order, seed streams, defaults and parameter admission follow the saved recipe.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bounded kind check and one lookup precede the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved and named calls use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createLongTool(
  params: createLongTool.IParams,
  seed?: number | string,
): AutoMovieArchetype<createLongTool.Affordance, createLongTool.Dimension> {
  const kind: createLongTool.Kind = ArchetypeDraw.choice(
    "longTool",
    "kind",
    params.kind,
    createLongTool.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  const produce: (
    params: createLongTool.IParams,
    seed?: number | string,
  ) => AutoMovieArchetype<createLongTool.Affordance, createLongTool.Dimension> =
    createLongTool.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility tables and types for saved long implement recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compatibility tables and types for saved long implement recipes.
 * @evidence contracts/development/design.md#principled-representation The kind union retains the saved spelling and order. Each kind selects the named producer with the same geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the existing recipe tables and names for authored and saved callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The named producers draw the sizes and model figures from the saved bands.
 */
export namespace createLongTool {
  /** The original kind for the saved long implement recipe. */
  export type Kind = LongImplementDraw.Kind;

  /** The original kinds for the saved long implement recipe. */
  export const KINDS: typeof LongImplementDraw.KINDS = LongImplementDraw.KINDS;

  /** The original rod_grip for the saved long implement recipe. */
  export const ROD_GRIP: typeof LongImplementDraw.ROD_GRIP =
    LongImplementDraw.ROD_GRIP;

  /** The original head_width for the saved long implement recipe. */
  export const HEAD_WIDTH: typeof LongImplementDraw.HEAD_WIDTH =
    LongImplementDraw.HEAD_WIDTH;

  /** The original blade_width for the saved long implement recipe. */
  export const BLADE_WIDTH: typeof LongImplementDraw.BLADE_WIDTH =
    LongImplementDraw.BLADE_WIDTH;

  /** The original d_grip for the saved long implement recipe. */
  export const D_GRIP: typeof LongImplementDraw.D_GRIP =
    LongImplementDraw.D_GRIP;

  /** The original affordance for the saved long implement recipe. */
  export type Affordance = LongImplementDraw.Affordance;

  /** The original dimension for the saved long implement recipe. */
  export type Dimension = LongImplementDraw.Dimension;

  /** The original units for the saved long implement recipe. */
  export const UNITS: typeof LongImplementDraw.UNITS = LongImplementDraw.UNITS;

  /** The original iparams for the saved long implement recipe. */
  export type IParams = LongImplementDraw.IParams;

  /** The original figures for the saved long implement recipe. */
  export type Figures = LongImplementDraw.Figures;

  /** The original model for the saved long implement recipe. */
  export type Model = LongImplementDraw.Model;

  /** The original models for the saved long implement recipe. */
  export const MODELS: typeof LongImplementDraw.MODELS =
    LongImplementDraw.MODELS;

  /** The original bands for the saved long implement recipe. */
  export const BANDS: typeof LongImplementDraw.BANDS = LongImplementDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    broom: createBroom,
    mop: createMop,
    shovel: createShovel,
    forestAxe: createForestAxe,
    fishingRod: createFishingRod,
    spongeRammer: createStageSpongeRammer,
    worm: createStageWorm,
    trailHandspike: createStageTrailHandspike,
    sling: createStageSling,
    atlatl: createStageAtlatl,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
