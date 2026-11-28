import {
  type AutoMovieArchetype,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { GroomingPropDraw } from "./internal/GroomingPropDraw";
import { AutoMovieArchetypeComb } from "./AutoMovieArchetypeComb";
import { AutoMovieArchetypeLipstick } from "./AutoMovieArchetypeLipstick";
import { AutoMovieArchetypeShavingRazor } from "./AutoMovieArchetypeShavingRazor";
import { AutoMovieArchetypeSqueezeTube } from "./AutoMovieArchetypeSqueezeTube";
import { AutoMovieArchetypeTissue } from "./AutoMovieArchetypeTissue";
import { AutoMovieArchetypeToothbrush } from "./AutoMovieArchetypeToothbrush";

/** Replays six saved personal-care recipes through their named producers. */
export namespace AutoMovieArchetypeCareItem {
/**
 * Build the personal-care prop selected by a saved recipe.
 *
 * @param params A saved kind, optional scene ID and applicable fixed
 *   measurements. Only tube and razor recipes use the model field.
 * @param seed Numeric seed for omitted values and models. Without it
 *   the default tube is `alltub13_5` and the default razor is `edwinJagger`.
 * @returns The named prop with its measured dimensions and local contacts.
 *   The default scene ID is `careItem`.
 * @throws {AutoMovieArchetypeRefusal} If the kind, chosen model or fixed value is inadmissible.
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
  /**
   * Saved selectors for tissues, combs, toothbrushes, tubes, razors and lipstick.
   */
  export type Kind = GroomingPropDraw.Kind;

  /** The six accepted saved selectors in gallery order. */
  export const KINDS: typeof GroomingPropDraw.KINDS = GroomingPropDraw.KINDS;

  /** Estimated razor head size in metres, 0.04 across X and 0.015 along Z. */
  export const CARTRIDGE: typeof GroomingPropDraw.CARTRIDGE =
    GroomingPropDraw.CARTRIDGE;

  /** Exposed length of the lipstick bullet in metres, 0.015. */
  export const BULLET: typeof GroomingPropDraw.BULLET = GroomingPropDraw.BULLET;

  /**
   * Grips and working faces for all six props, plus a turning cap for the tube.
   */
  export type Affordance = GroomingPropDraw.Affordance;

  /**
   * Length follows Z. Width and thickness use the selected prop's
   * construction frame. Lengths use metres and mass uses kilograms.
   */
  export type Dimension = GroomingPropDraw.Dimension;

  /** Units for the saved recipe's dimensions and model figures. */
  export const UNITS: typeof GroomingPropDraw.UNITS = GroomingPropDraw.UNITS;

  /**
   * Saved selector, optional scene ID, applicable finite measurements and tube or razor model.
   */
  export type IParams = GroomingPropDraw.IParams;

  /** Recorded tube diameter or correlated razor length and mass. */
  export type Figures = GroomingPropDraw.Figures;

  /**
   * Ten Alltub diameter IDs and the Edwin Jagger and Gillette Mach3 razor IDs.
   */
  export type Model = GroomingPropDraw.Model;

  /**
   * Tube diameters and whole razor measurements, with the default record first for each kind.
   */
  export const MODELS: typeof GroomingPropDraw.MODELS = GroomingPropDraw.MODELS;

  /** Allowed length bands in metres for each Alltub diameter. */
  export const TUBE_LENGTHS: typeof GroomingPropDraw.TUBE_LENGTHS =
    GroomingPropDraw.TUBE_LENGTHS;

  /**
   * Dimensions by saved kind. The selected tube diameter supplies its own length band.
   */
  export const BANDS: typeof GroomingPropDraw.BANDS = GroomingPropDraw.BANDS;

  /**
   * Factory map from saved selectors to the corresponding narrow named constructors.
   */
  export const PRODUCERS = {
    tissue: AutoMovieArchetypeTissue.create,
    comb: AutoMovieArchetypeComb.create,
    toothbrush: AutoMovieArchetypeToothbrush.create,
    tube: AutoMovieArchetypeSqueezeTube.create,
    razor: AutoMovieArchetypeShavingRazor.create,
    lipstick: AutoMovieArchetypeLipstick.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;
}
