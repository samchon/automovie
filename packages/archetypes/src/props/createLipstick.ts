import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Lipstick case with a precision grip and an exposed tip along +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createLipstick(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createLipstick.Affordance, createLipstick.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createLipstick.Affordance>> =
    GroomingPropDraw.prepare<createLipstick.Affordance>(
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

/** The contacts and dimensions of {@link createLipstick}. */
export namespace createLipstick {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "width";
}
