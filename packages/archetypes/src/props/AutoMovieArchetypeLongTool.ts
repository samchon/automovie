import { ArchetypeDraw, type AutoMovieArchetype } from "../core/index";
import { LongImplementDraw } from "./LongImplementDraw";
import { AutoMovieArchetypeBroom } from "./AutoMovieArchetypeBroom";
import { AutoMovieArchetypeFishingRod } from "./AutoMovieArchetypeFishingRod";
import { AutoMovieArchetypeForestAxe } from "./AutoMovieArchetypeForestAxe";
import { AutoMovieArchetypeMop } from "./AutoMovieArchetypeMop";
import { AutoMovieArchetypeShovel } from "./AutoMovieArchetypeShovel";
import { AutoMovieArchetypeStageAtlatl } from "./AutoMovieArchetypeStageAtlatl";
import { AutoMovieArchetypeStageSling } from "./AutoMovieArchetypeStageSling";
import { AutoMovieArchetypeStageSpongeRammer } from "./AutoMovieArchetypeStageSpongeRammer";
import { AutoMovieArchetypeStageTrailHandspike } from "./AutoMovieArchetypeStageTrailHandspike";
import { AutoMovieArchetypeStageWorm } from "./AutoMovieArchetypeStageWorm";

/** Constructs the long tool archetype from its recipe. */
export namespace AutoMovieArchetypeLongTool {
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
export function create(
  params: AutoMovieArchetypeLongTool.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLongTool.Affordance, AutoMovieArchetypeLongTool.Dimension> {
  const kind: AutoMovieArchetypeLongTool.Kind = ArchetypeDraw.choice(
    "longTool",
    "kind",
    params.kind,
    AutoMovieArchetypeLongTool.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeLongTool.PRODUCERS[kind](params, seed);
}

  /* Compatibility tables and types for saved long implement recipes. */
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
    broom: AutoMovieArchetypeBroom.create,
    mop: AutoMovieArchetypeMop.create,
    shovel: AutoMovieArchetypeShovel.create,
    forestAxe: AutoMovieArchetypeForestAxe.create,
    fishingRod: AutoMovieArchetypeFishingRod.create,
    spongeRammer: AutoMovieArchetypeStageSpongeRammer.create,
    worm: AutoMovieArchetypeStageWorm.create,
    trailHandspike: AutoMovieArchetypeStageTrailHandspike.create,
    sling: AutoMovieArchetypeStageSling.create,
    atlatl: AutoMovieArchetypeStageAtlatl.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
