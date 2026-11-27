import { type AutoMovieArchetype } from "../core/index";
import { createStationery as createStationeryImplementation } from "./internal/createStationery";
import { StationeryDraw } from "./StationeryDraw";
import { AutoMovieArchetypeBook } from "./AutoMovieArchetypeBook";
import { AutoMovieArchetypePaper } from "./AutoMovieArchetypePaper";
import { AutoMovieArchetypePen } from "./AutoMovieArchetypePen";
import { AutoMovieArchetypeClipboard } from "./AutoMovieArchetypeClipboard";

/** Public operations for Auto Movie Archetype Stationery. */
export namespace AutoMovieArchetypeStationery {
  /**
   * Read a saved stationery recipe and call the producer for its kind.
   *
   * @param params The saved kind, fixed values, optional identifier and model
   *   when applicable.
   * @param seed The seed that draws the saved dimensions and model, or undefined
   *   for the original defaults.
   * @returns The selected prop in its original frame.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(params: AutoMovieArchetypeStationery.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeStationery.Affordance, AutoMovieArchetypeStationery.Dimension> {
    return createStationeryImplementation(params, seed);
  }

  /** The original kind for the saved stationery recipe. */
  export type Kind = StationeryDraw.Kind;

  /** The original kinds for the saved stationery recipe. */
  export const KINDS: typeof StationeryDraw.KINDS = StationeryDraw.KINDS;

  /** The original affordance for the saved stationery recipe. */
  export type Affordance = StationeryDraw.Affordance;

  /** The original dimension for the saved stationery recipe. */
  export type Dimension = StationeryDraw.Dimension;

  /** The original units for the saved stationery recipe. */
  export const UNITS: typeof StationeryDraw.UNITS = StationeryDraw.UNITS;

  /** The original iparams for the saved stationery recipe. */
  export type IParams = StationeryDraw.IParams;

  /** The original figures for the saved stationery recipe. */
  export type Figures = StationeryDraw.Figures;

  /** The original model for the saved stationery recipe. */
  export type Model = StationeryDraw.Model;

  /** The original models for the saved stationery recipe. */
  export const MODELS: typeof StationeryDraw.MODELS = StationeryDraw.MODELS;

  /** The original bands for the saved stationery recipe. */
  export const BANDS: typeof StationeryDraw.BANDS = StationeryDraw.BANDS;

  /** The named producer selected by each saved kind. */
  export const PRODUCERS = {
    book: AutoMovieArchetypeBook.create,
    paper: AutoMovieArchetypePaper.create,
    pen: AutoMovieArchetypePen.create,
    clipboard: AutoMovieArchetypeClipboard.create,
    map: AutoMovieArchetypePaper.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;

  /** Each saved selector's named variant. */
  export interface IProducerVariants {
    /** The named variant for the saved `paper` selector. */
    paper: AutoMovieArchetypePaper.Format;

    /** The named variant for the saved `map` selector. */
    map: AutoMovieArchetypePaper.Format;
  }

  /** The named format selected by a legacy paper or map recipe. */
  export const PRODUCER_VARIANTS: Readonly<IProducerVariants> = {
    paper: "sheet",
    map: "foldedMap",
  };}
