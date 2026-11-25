import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Flat tissue sheet with a centered pinch and a wiping surface above it.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createTissue(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass" | "thickness"
  > = {},
  seed?: number,
): AutoMovieArchetype<createTissue.Affordance, createTissue.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createTissue.Affordance>> =
    GroomingPropDraw.prepare<createTissue.Affordance>("tissue", params, seed);
  const length: number = d.length!;
  const width: number = d.width!;
  const thick: number = d.thickness ?? width;

  builder.box(
    "sheet",
    Vector3.create(width, thick, length),
    Vector3.create(0, thick / 2, 0),
    { color: "#f6f4f0" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, thick / 2, 0)),
    extent: null,
    grip: "precision",
    aperture: thick,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, thick, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createTissue}. */
export namespace createTissue {
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
