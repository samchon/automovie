import type { AutoMovieArchetypeTissue } from "../AutoMovieArchetypeTissue";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
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
): AutoMovieArchetype<AutoMovieArchetypeTissue.Affordance, AutoMovieArchetypeTissue.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<AutoMovieArchetypeTissue.Affordance>> =
    GroomingPropDraw.prepare<AutoMovieArchetypeTissue.Affordance>("tissue", params, seed);
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
