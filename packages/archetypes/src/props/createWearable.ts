import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { WornPropDraw } from "./WornPropDraw";
import { createCyclingHelmet } from "./createCyclingHelmet";
import { createHat } from "./createHat";
import { createSpectacles } from "./createSpectacles";
import { createWatch } from "./createWatch";

/**
 * Read a saved wearable recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model
 *   when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined
 *   for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createWearable(
  params: createWearable.IParams,
  seed?: number,
): AutoMovieArchetype<createWearable.Affordance, createWearable.Dimension> {
  const kind: createWearable.Kind = ArchetypeDraw.choice(
    "wearable",
    "kind",
    params.kind,
    createWearable.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return createWearable.PRODUCERS[kind](params, seed);
}

/** Compatibility tables and types for saved wearable recipes. */
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
