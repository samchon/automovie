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
 * @param params The saved kind, fixed values, optional identifier and model
 *   when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined
 *   for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
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

/** Compatibility tables and types for saved long implement recipes. */
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
