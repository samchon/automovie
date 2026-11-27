import { ArchetypeDraw, type AutoMovieArchetype } from "../core/index";
import { HandToolDraw } from "./HandToolDraw";
import { AutoMovieArchetypeFork } from "./AutoMovieArchetypeFork";
import { AutoMovieArchetypeHammer } from "./AutoMovieArchetypeHammer";
import { AutoMovieArchetypeHandSaw } from "./AutoMovieArchetypeHandSaw";
import { AutoMovieArchetypeLadle } from "./AutoMovieArchetypeLadle";
import { AutoMovieArchetypeScrewdriver } from "./AutoMovieArchetypeScrewdriver";
import { AutoMovieArchetypeSpoon } from "./AutoMovieArchetypeSpoon";
import { AutoMovieArchetypeStagePrimingWire } from "./AutoMovieArchetypeStagePrimingWire";
import { createTableKnife } from "./createTableKnife";

/** Constructs the tool archetype from its recipe. */
export namespace AutoMovieArchetypeTool {
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
export function create(
  params: AutoMovieArchetypeTool.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTool.Affordance, AutoMovieArchetypeTool.Dimension> {
  const kind: AutoMovieArchetypeTool.Kind = ArchetypeDraw.choice(
    "tool",
    "kind",
    params.kind,
    AutoMovieArchetypeTool.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeTool.PRODUCERS[kind](params, seed);
}
}

/** Compatibility tables and types for saved tool recipes. */
export namespace AutoMovieArchetypeTool {
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
    hammer: AutoMovieArchetypeHammer.create,
    saw: AutoMovieArchetypeHandSaw.create,
    screwdriver: AutoMovieArchetypeScrewdriver.create,
    spoon: AutoMovieArchetypeSpoon.create,
    fork: AutoMovieArchetypeFork.create,
    ladle: AutoMovieArchetypeLadle.create,
    knife: createTableKnife,
    primingWire: AutoMovieArchetypeStagePrimingWire.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
