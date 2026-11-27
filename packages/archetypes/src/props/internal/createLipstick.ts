import type { AutoMovieArchetypeLipstick } from "../AutoMovieArchetypeLipstick";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { GroomingPropDraw } from "./GroomingPropDraw";

/*
 * Lipstick case with a precision grip and an exposed tip along +Z.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createLipstick(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLipstick.Affordance, AutoMovieArchetypeLipstick.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<AutoMovieArchetypeLipstick.Affordance>> =
    GroomingPropDraw.prepare<AutoMovieArchetypeLipstick.Affordance>(
      "lipstick",
      params,
      seed,
    );
  const length: number = d.length!;
  const width: number = d.width!;

  // A case held in the fingers, its bullet out of its far end.
  builder.rod(
    "case",
    width / 2,
    Vector3.create(0, width / 2, 0),
    Vector3.create(0, width / 2, length - GroomingPropDraw.BULLET),
    { color: "#1d1f22" },
  );
  builder.rod(
    "bullet",
    width * 0.3,
    Vector3.create(0, width / 2, length - GroomingPropDraw.BULLET),
    Vector3.create(0, width / 2, length),
    { color: "#b22234" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, width / 2, (length - GroomingPropDraw.BULLET) / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: width,
    length: length - GroomingPropDraw.BULLET,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, width / 2, length),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
