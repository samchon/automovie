import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Clipboard with a grip on its near edge and a level writing surface.
 *
 * The near edge lies toward model `+Z` and the clip end toward model `-Z`, so
 * `face` reads with model `-Z` as its top.
 *
 * @param params The optional scene ID and Esselte model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createClipboard(
  params: Pick<StationeryDraw.IParams, "id"> & {
    model?: StationeryDraw.Model;
  } = {},
  seed?: number,
): AutoMovieArchetype<createClipboard.Affordance, createClipboard.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<createClipboard.Affordance>> =
    StationeryDraw.prepare<createClipboard.Affordance>(
      "clipboard",
      params,
      seed,
    );
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.box(
    "board",
    Vector3.create(width, thick, length),
    Vector3.create(0, thick / 2, 0),
    { color: "#8a6a4a" },
  );
  StationeryDraw.addPanelContacts(builder, { width, length, thick }, 0);
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createClipboard}. */
export namespace createClipboard {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";
}
