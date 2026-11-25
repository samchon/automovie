import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";
import { createComb } from "./createComb";
import { createLipstick } from "./createLipstick";
import { createShavingRazor } from "./createShavingRazor";
import { createSqueezeTube } from "./createSqueezeTube";
import { createTissue } from "./createTissue";
import { createToothbrush } from "./createToothbrush";

/**
 * Read a saved grooming prop recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model
 *   when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined
 *   for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createCareItem(
  params: createCareItem.IParams,
  seed?: number,
): AutoMovieArchetype<createCareItem.Affordance, createCareItem.Dimension> {
  const kind: createCareItem.Kind = ArchetypeDraw.choice(
    "careItem",
    "kind",
    params.kind,
    createCareItem.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  // The saved input spans every variant; the selected producer admits its own
  // parameters with its own draw.
  const produce = createCareItem.PRODUCERS[kind] as (
    params: createCareItem.IParams,
    seed?: number,
  ) => AutoMovieArchetype<createCareItem.Affordance, createCareItem.Dimension>;
  return produce(params, seed);
}

/** Compatibility tables and types for saved grooming prop recipes. */
export namespace createCareItem {
  /** The original kind for the saved grooming prop recipe. */
  export type Kind = GroomingPropDraw.Kind;

  /** The original kinds for the saved grooming prop recipe. */
  export const KINDS: typeof GroomingPropDraw.KINDS = GroomingPropDraw.KINDS;

  /** The original cartridge for the saved grooming prop recipe. */
  export const CARTRIDGE: typeof GroomingPropDraw.CARTRIDGE =
    GroomingPropDraw.CARTRIDGE;

  /** The original bullet for the saved grooming prop recipe. */
  export const BULLET: typeof GroomingPropDraw.BULLET = GroomingPropDraw.BULLET;

  /** The original affordance for the saved grooming prop recipe. */
  export type Affordance = GroomingPropDraw.Affordance;

  /** The original dimension for the saved grooming prop recipe. */
  export type Dimension = GroomingPropDraw.Dimension;

  /** The original units for the saved grooming prop recipe. */
  export const UNITS: typeof GroomingPropDraw.UNITS = GroomingPropDraw.UNITS;

  /** The original iparams for the saved grooming prop recipe. */
  export type IParams = GroomingPropDraw.IParams;

  /** The original figures for the saved grooming prop recipe. */
  export type Figures = GroomingPropDraw.Figures;

  /** The original model for the saved grooming prop recipe. */
  export type Model = GroomingPropDraw.Model;

  /** The original models for the saved grooming prop recipe. */
  export const MODELS: typeof GroomingPropDraw.MODELS = GroomingPropDraw.MODELS;

  /** The original tube length ranges for the saved grooming prop recipe. */
  export const TUBE_LENGTHS: typeof GroomingPropDraw.TUBE_LENGTHS =
    GroomingPropDraw.TUBE_LENGTHS;

  /** The original bands for the saved grooming prop recipe. */
  export const BANDS: typeof GroomingPropDraw.BANDS = GroomingPropDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    tissue: createTissue,
    comb: createComb,
    toothbrush: createToothbrush,
    tube: createSqueezeTube,
    razor: createShavingRazor,
    lipstick: createLipstick,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
