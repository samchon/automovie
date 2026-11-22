import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";
import { createCigarette } from "./createCigarette";
import { createLighter } from "./createLighter";

/**
 * Read a saved smoking prop recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Read a saved smoking prop recipe and call the producer for its kind.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects the named producer that owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper validates the saved kind and hands off the input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kind order, seed streams, defaults and parameter admission follow the saved recipe.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bounded kind check and one lookup precede the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved and named calls use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createSmoking(
  params: createSmoking.IParams,
  seed?: number | string,
): AutoMovieArchetype<createSmoking.Affordance, createSmoking.Dimension> {
  const kind: createSmoking.Kind = ArchetypeDraw.choice(
    "smoking",
    "kind",
    params.kind,
    createSmoking.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  const produce: (
    params: createSmoking.IParams,
    seed?: number | string,
  ) => AutoMovieArchetype<createSmoking.Affordance, createSmoking.Dimension> =
    createSmoking.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility tables and types for saved smoking prop recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compatibility tables and types for saved smoking prop recipes.
 * @evidence contracts/development/design.md#principled-representation The kind union retains the saved spelling and order. Each kind selects the named producer with the same geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the existing recipe tables and names for authored and saved callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The named producers draw the sizes and model figures from the saved bands.
 */
export namespace createSmoking {
  /** The original kind for the saved smoking prop recipe. */
  export type Kind = SmokingPropDraw.Kind;

  /** The original kinds for the saved smoking prop recipe. */
  export const KINDS: typeof SmokingPropDraw.KINDS = SmokingPropDraw.KINDS;

  /** The original affordance for the saved smoking prop recipe. */
  export type Affordance = SmokingPropDraw.Affordance;

  /** The original dimension for the saved smoking prop recipe. */
  export type Dimension = SmokingPropDraw.Dimension;

  /** The original units for the saved smoking prop recipe. */
  export const UNITS: typeof SmokingPropDraw.UNITS = SmokingPropDraw.UNITS;

  /** The original iparams for the saved smoking prop recipe. */
  export type IParams = SmokingPropDraw.IParams;

  /** The original figures for the saved smoking prop recipe. */
  export type Figures = SmokingPropDraw.Figures;

  /** The original model for the saved smoking prop recipe. */
  export type Model = SmokingPropDraw.Model;

  /** The original models for the saved smoking prop recipe. */
  export const MODELS: typeof SmokingPropDraw.MODELS = SmokingPropDraw.MODELS;

  /** The original bands for the saved smoking prop recipe. */
  export const BANDS: typeof SmokingPropDraw.BANDS = SmokingPropDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    cigarette: createCigarette,
    lighter: createLighter,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
