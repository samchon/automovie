import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { StationeryDraw } from "./StationeryDraw";
import { createBook } from "./createBook";
import { createClipboard } from "./createClipboard";
import { createPaper } from "./createPaper";
import { createPen } from "./createPen";

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
export function createStationery(
  params: createStationery.IParams,
  seed?: number | string,
): AutoMovieArchetype<createStationery.Affordance, createStationery.Dimension> {
  const kind: createStationery.Kind = ArchetypeDraw.choice(
    "stationery",
    "kind",
    params.kind,
    createStationery.KINDS,
  );
  if (kind === "paper" || kind === "map")
    return createPaper(
      { ...params, format: createStationery.PRODUCER_VARIANTS[kind] },
      seed,
    );

  // The saved input spans every variant. The selected producer checks its original recipe.
  const produce: (
    params: createStationery.IParams,
    seed?: number | string,
  ) => AutoMovieArchetype<
    createStationery.Affordance,
    createStationery.Dimension
  > = createStationery.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/** Compatibility tables and types for saved stationery recipes. */
export namespace createStationery {
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
    book: createBook,
    paper: createPaper,
    pen: createPen,
    clipboard: createClipboard,
    map: createPaper,
  } as const satisfies Readonly<Record<Kind, unknown>>;

  /** Each saved selector's named variant. */
  export interface IProducerVariants {
    /** The named variant for the saved `paper` selector. */
    paper: createPaper.Format;

    /** The named variant for the saved `map` selector. */
    map: createPaper.Format;
  }

  /** The named format selected by a legacy paper or map recipe. */
  export const PRODUCER_VARIANTS: Readonly<IProducerVariants> = {
    paper: "sheet",
    map: "foldedMap",
  };
}
