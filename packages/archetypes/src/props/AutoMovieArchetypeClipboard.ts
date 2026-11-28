import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StationeryDraw } from "./internal/StationeryDraw";

/**
 * Constructs an Esselte clipboard proxy with a writing face and near-edge pinch.
 */
export namespace AutoMovieArchetypeClipboard {
/**
 * Build a level A4 clipboard with its near edge at model `+Z`.
 *
 * Both catalogue entries use a 232 by 349 millimetre board, 3 millimetres
 * thick. The upper writing frame uses model `-Z` as its head direction.
 *
 * @param params Optional scene ID and Esselte model. Defaults to ID `stationery`.
 * @param seed Numeric seed for an omitted model. Omit it for `56055` at 168 grams.
 * @returns The board with `face` on top and `grip` at its near edge.
 * @throws {AutoMovieArchetypeRefusal} If the catalogue model is unavailable.
 */
export function create(
  params: AutoMovieArchetypeClipboard.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeClipboard.Affordance, AutoMovieArchetypeClipboard.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<AutoMovieArchetypeClipboard.Affordance>> =
    StationeryDraw.prepare<AutoMovieArchetypeClipboard.Affordance>(
      "clipboard",
      params,
      seed,
    );
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.box(
    "board",
    AutoMovieEngineVector3.create(width, thick, length),
    AutoMovieEngineVector3.create(0, thick / 2, 0),
    { color: "#8a6a4a" },
  );
  StationeryDraw.addPanelContacts(builder, { width, length, thick }, 0);
  return builder.build(d.mass!);
}


  /* The contacts and dimensions of {@link AutoMovieArchetypeClipboard}. */
  /** Optional scene ID and a recorded Esselte clipboard model. */
  export interface IParams {
    /** Scene object ID, defaulting to `stationery`. */
    id?: string;
    /** Selects `56055` or `604037`. Omit it and the seed for `56055`. */
    model?: StationeryDraw.Model;
  }

  /** Upward writing `face` and a precision `grip` at the `+Z` edge. */
  export type Affordance = "face" | "grip";

  /**
   * Board width in X, length in Z and thickness in Y, in metres. Model mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";
}
