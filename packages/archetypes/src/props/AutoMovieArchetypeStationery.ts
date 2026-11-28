import { type AutoMovieArchetype } from "../core/index";
import { createStationery as createStationeryImplementation } from "./internal/createStationery";
import { StationeryDraw } from "./internal/StationeryDraw";
import { AutoMovieArchetypeBook } from "./AutoMovieArchetypeBook";
import { AutoMovieArchetypePaper } from "./AutoMovieArchetypePaper";
import { AutoMovieArchetypePen } from "./AutoMovieArchetypePen";
import { AutoMovieArchetypeClipboard } from "./AutoMovieArchetypeClipboard";

/** Replays saved stationery recipes through their named producers. */
export namespace AutoMovieArchetypeStationery {
  /**
   * Build a saved book, sheet, pen, clipboard or folded map.
   *
   * @param params Saved kind, optional scene ID and applicable finite
   *   dimensions. Only a clipboard uses a catalogue model.
   * @param seed Numeric seed for omitted values. Without it bands use
   *   midpoints and the clipboard uses model `56055`.
   * @returns The named construction with its original `stationery`
   *   default ID and local contact frames.
   * @throws {AutoMovieArchetypeRefusal} If a kind, model or fixed value is inadmissible.
   */
  export function create(params: AutoMovieArchetypeStationery.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeStationery.Affordance, AutoMovieArchetypeStationery.Dimension> {
    return createStationeryImplementation(params, seed);
  }

  /** Saved selectors for a book, paper sheet, pen, clipboard and folded map. */
  export type Kind = StationeryDraw.Kind;

  /** Saved stationery selectors in gallery order. */
  export const KINDS: typeof StationeryDraw.KINDS = StationeryDraw.KINDS;

  /**
   * Contact names for precision grips, writing faces, and articulated
   * book and map panels. Each prop exposes its applicable subset.
   */
  export type Affordance = StationeryDraw.Affordance;

  /**
   * Panel width along X, length along Z and thickness along Y in metres.
   * A pen uses length and barrel diameter as `thickness`. Mass is in kilograms.
   */
  export type Dimension = StationeryDraw.Dimension;

  /** Units shared by the stationery bands and clipboard catalogue. */
  export const UNITS: typeof StationeryDraw.UNITS = StationeryDraw.UNITS;

  /**
   * Saved kind, optional scene ID, applicable finite dimensions and an optional clipboard catalogue model.
   */
  export type IParams = StationeryDraw.IParams;

  /** Geometry and mass of one admitted clipboard catalogue entry. */
  export type Figures = StationeryDraw.Figures;

  /** Esselte clipboard catalogue numbers `56055` and `604037`. */
  export type Model = StationeryDraw.Model;

  /**
   * Clipboard model rows with the shared A4 board dimensions and distinct masses.
   */
  export const MODELS: typeof StationeryDraw.MODELS = StationeryDraw.MODELS;

  /**
   * Free dimensions by saved kind. The clipboard obtains its dimensions from its selected model.
   */
  export const BANDS: typeof StationeryDraw.BANDS = StationeryDraw.BANDS;

  /**
   * Named factories keyed by saved kind. Paper and map share the paper factory and use distinct formats.
   */
  export const PRODUCERS = {
    book: AutoMovieArchetypeBook.create,
    paper: AutoMovieArchetypePaper.create,
    pen: AutoMovieArchetypePen.create,
    clipboard: AutoMovieArchetypeClipboard.create,
    map: AutoMovieArchetypePaper.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;

  /** Named paper formats corresponding to the two saved paper selectors. */
  export interface IProducerVariants {
    /** The format for a saved loose-paper recipe. */
    paper: AutoMovieArchetypePaper.Format;

    /** The format for a saved folding-map recipe. */
    map: AutoMovieArchetypePaper.Format;
  }

  /** Mapping from saved `paper` to `sheet` and saved `map` to `foldedMap`. */
  export const PRODUCER_VARIANTS: Readonly<IProducerVariants> = {
    paper: "sheet",
    map: "foldedMap",
  };}
