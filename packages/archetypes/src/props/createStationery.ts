import { type Archetype, ArchetypeDraw } from "../core";
import { StationeryDraw } from "./StationeryDraw";
import { createBook } from "./createBook";
import { createClipboard } from "./createClipboard";
import { createPaper } from "./createPaper";
import { createPen } from "./createPen";

/**
 * Read a saved stationery recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Read a saved stationery recipe and call the producer for its kind.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects the named producer that owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper validates the saved kind and hands off the input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kind order, seed streams, defaults and parameter admission follow the saved recipe.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bounded kind check and one lookup precede the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved and named calls use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStationery(
  params: createStationery.IParams,
  seed?: number | string,
): Archetype<createStationery.Affordance, createStationery.Dimension> {
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
  ) => Archetype<createStationery.Affordance, createStationery.Dimension> =
    createStationery.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility tables and types for saved stationery recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compatibility tables and types for saved stationery recipes.
 * @evidence contracts/development/design.md#principled-representation The kind union retains the saved spelling and order. Each kind selects the named producer with the same geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the existing recipe tables and names for authored and saved callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The named producers draw the actual sizes and model figures from the saved bands.
 */
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

  /** The named format selected by a legacy paper or map recipe. */
  export const PRODUCER_VARIANTS: Readonly<{
    paper: createPaper.Format;
    map: createPaper.Format;
  }> = {
    paper: "sheet",
    map: "foldedMap",
  };
}
