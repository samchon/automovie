import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { WornPropDraw } from "./WornPropDraw";
import { createCyclingHelmet } from "./createCyclingHelmet";
import { createHat } from "./createHat";
import { createSpectacles } from "./createSpectacles";
import { createWatch } from "./createWatch";

/**
 * Read a saved wearable recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Read a saved wearable recipe and call the producer for its kind.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects the named producer that owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper validates the saved kind and hands off the input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kind order, seed streams, defaults and parameter admission follow the saved recipe.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bounded kind check and one lookup precede the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved and named calls use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createWearable(
  params: createWearable.IParams,
  seed?: number | string,
): AutoMovieArchetype<createWearable.Affordance, createWearable.Dimension> {
  const kind: createWearable.Kind = ArchetypeDraw.choice(
    "wearable",
    "kind",
    params.kind,
    createWearable.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  const produce: (
    params: createWearable.IParams,
    seed?: number | string,
  ) => AutoMovieArchetype<createWearable.Affordance, createWearable.Dimension> =
    createWearable.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility tables and types for saved wearable recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compatibility tables and types for saved wearable recipes.
 * @evidence contracts/development/design.md#principled-representation The kind union retains the saved spelling and order. Each kind selects the named producer with the same geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the existing recipe tables and names for authored and saved callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The named producers draw the actual sizes and model figures from the saved bands.
 */
export namespace createWearable {
  /** The original kind for the saved wearable recipe. */
  export type Kind = WornPropDraw.Kind;

  /** The original kinds for the saved wearable recipe. */
  export const KINDS: typeof WornPropDraw.KINDS = WornPropDraw.KINDS;

  /** The original thin for the saved wearable recipe. */
  export const THIN: typeof WornPropDraw.THIN = WornPropDraw.THIN;

  /** The original strap for the saved wearable recipe. */
  export const STRAP: typeof WornPropDraw.STRAP = WornPropDraw.STRAP;

  /** The original affordance for the saved wearable recipe. */
  export type Affordance = WornPropDraw.Affordance;

  /** The original dimension for the saved wearable recipe. */
  export type Dimension = WornPropDraw.Dimension;

  /** The original units for the saved wearable recipe. */
  export const UNITS: typeof WornPropDraw.UNITS = WornPropDraw.UNITS;

  /** The original iparams for the saved wearable recipe. */
  export type IParams = WornPropDraw.IParams;

  /** The original bands for the saved wearable recipe. */
  export const BANDS: typeof WornPropDraw.BANDS = WornPropDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    watch: createWatch,
    hat: createHat,
    spectacles: createSpectacles,
    helmet: createCyclingHelmet,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
