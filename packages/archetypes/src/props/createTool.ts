import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { HandToolDraw } from "./HandToolDraw";
import { createFork } from "./createFork";
import { createHammer } from "./createHammer";
import { createHandSaw } from "./createHandSaw";
import { createLadle } from "./createLadle";
import { createScrewdriver } from "./createScrewdriver";
import { createSpoon } from "./createSpoon";
import { createStagePrimingWire } from "./createStagePrimingWire";
import { createTableKnife } from "./createTableKnife";

/**
 * Read a saved tool recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model
 *   when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined
 *   for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createTool(
  params: createTool.IParams,
  seed?: number,
): AutoMovieArchetype<createTool.Affordance, createTool.Dimension> {
  const kind: createTool.Kind = ArchetypeDraw.choice(
    "tool",
    "kind",
    params.kind,
    createTool.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  const produce: (
    params: createTool.IParams,
    seed?: number,
  ) => AutoMovieArchetype<createTool.Affordance, createTool.Dimension> =
    createTool.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/** Compatibility tables and types for saved tool recipes. */
export namespace createTool {
  /** The original kind for the saved tool recipe. */
  export type Kind = HandToolDraw.Kind;

  /** The original kinds for the saved tool recipe. */
  export const KINDS: typeof HandToolDraw.KINDS = HandToolDraw.KINDS;

  /** The original knife_thickness for the saved tool recipe. */
  export const KNIFE_THICKNESS: typeof HandToolDraw.KNIFE_THICKNESS =
    HandToolDraw.KNIFE_THICKNESS;

  /** The original tines for the saved tool recipe. */
  export const TINES: typeof HandToolDraw.TINES = HandToolDraw.TINES;

  /** The original blade_depth for the saved tool recipe. */
  export const BLADE_DEPTH: typeof HandToolDraw.BLADE_DEPTH =
    HandToolDraw.BLADE_DEPTH;

  /** The original grip for the saved tool recipe. */
  export const GRIP: typeof HandToolDraw.GRIP = HandToolDraw.GRIP;

  /** The original bowl for the saved tool recipe. */
  export const BOWL: typeof HandToolDraw.BOWL = HandToolDraw.BOWL;

  /** The original affordance for the saved tool recipe. */
  export type Affordance = HandToolDraw.Affordance;

  /** The original dimension for the saved tool recipe. */
  export type Dimension = HandToolDraw.Dimension;

  /** The original units for the saved tool recipe. */
  export const UNITS: typeof HandToolDraw.UNITS = HandToolDraw.UNITS;

  /** The original iparams for the saved tool recipe. */
  export type IParams = HandToolDraw.IParams;

  /** The original figures for the saved tool recipe. */
  export type Figures = HandToolDraw.Figures;

  /** The original model for the saved tool recipe. */
  export type Model = HandToolDraw.Model;

  /** The original models for the saved tool recipe. */
  export const MODELS: typeof HandToolDraw.MODELS = HandToolDraw.MODELS;

  /** The original bands for the saved tool recipe. */
  export const BANDS: typeof HandToolDraw.BANDS = HandToolDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    hammer: createHammer,
    saw: createHandSaw,
    screwdriver: createScrewdriver,
    spoon: createSpoon,
    fork: createFork,
    ladle: createLadle,
    knife: createTableKnife,
    primingWire: createStagePrimingWire,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
