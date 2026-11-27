import { ArchetypeDraw, type AutoMovieArchetype } from "../core/index";
import { GroomingPropDraw } from "./GroomingPropDraw";
import { AutoMovieArchetypeComb } from "./AutoMovieArchetypeComb";
import { AutoMovieArchetypeLipstick } from "./AutoMovieArchetypeLipstick";
import { AutoMovieArchetypeShavingRazor } from "./AutoMovieArchetypeShavingRazor";
import { AutoMovieArchetypeSqueezeTube } from "./AutoMovieArchetypeSqueezeTube";
import { AutoMovieArchetypeTissue } from "./AutoMovieArchetypeTissue";
import { AutoMovieArchetypeToothbrush } from "./AutoMovieArchetypeToothbrush";

/** Constructs the care item archetype from its recipe. */
export namespace AutoMovieArchetypeCareItem {
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
export function create(
  params: AutoMovieArchetypeCareItem.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCareItem.Affordance, AutoMovieArchetypeCareItem.Dimension> {
  const kind: AutoMovieArchetypeCareItem.Kind = ArchetypeDraw.choice(
    "careItem",
    "kind",
    params.kind,
    AutoMovieArchetypeCareItem.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeCareItem.Kind,
      (
        params: AutoMovieArchetypeCareItem.IParams,
        seed?: number,
      ) => AutoMovieArchetype<AutoMovieArchetypeCareItem.Affordance, AutoMovieArchetypeCareItem.Dimension>
    >
  > = {
    tissue: ({ model: _model, ...rest }, s) => AutoMovieArchetypeTissue.create(rest, s),
    comb: ({ model: _model, ...rest }, s) => AutoMovieArchetypeComb.create(rest, s),
    toothbrush: ({ model: _model, ...rest }, s) => AutoMovieArchetypeToothbrush.create(rest, s),
    tube: (p, s) => AutoMovieArchetypeSqueezeTube.create({ ...p, model: ArchetypeDraw.admit("careItem", "model", p.model, ["alltub13_5", "alltub19", "alltub22", "alltub25", "alltub28", "alltub30", "alltub35", "alltub38", "alltub40", "alltub50"] as const) }, s),
    razor: (p, s) => AutoMovieArchetypeShavingRazor.create({ ...p, model: ArchetypeDraw.admit("careItem", "model", p.model, ["edwinJagger", "gilletteMach3"] as const) }, s),
    lipstick: ({ model: _model, ...rest }, s) => AutoMovieArchetypeLipstick.create(rest, s),
  };
  return variants[kind](params, seed);
}

  /* Compatibility tables and types for saved grooming prop recipes. */
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
    tissue: AutoMovieArchetypeTissue.create,
    comb: AutoMovieArchetypeComb.create,
    toothbrush: AutoMovieArchetypeToothbrush.create,
    tube: AutoMovieArchetypeSqueezeTube.create,
    razor: AutoMovieArchetypeShavingRazor.create,
    lipstick: AutoMovieArchetypeLipstick.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
