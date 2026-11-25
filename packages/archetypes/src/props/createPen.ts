import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Pen with a precision pinch and an axial writing tip along +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createPen(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "length" | "thickness" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createPen.Affordance, createPen.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<createPen.Affordance>> =
    StationeryDraw.prepare<createPen.Affordance>("pen", params, seed);
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.rod(
    "barrel",
    thick / 2,
    Vector3.create(0, thick / 2, 0),
    Vector3.create(0, thick / 2, length),
    { color: "#2a4d8f" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, thick / 2, length - 0.03),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: thick,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, thick / 2, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createPen}. */
export namespace createPen {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness";
}
