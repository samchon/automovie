import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Squeeze tube with a body grip and an operable cap.
 *
 * @param params The optional scene ID, tube length in metres, mass in
 *   kilograms, and diameter model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createSqueezeTube(
  params: Pick<GroomingPropDraw.IParams, "id" | "length" | "mass"> & {
    model?: Exclude<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  } = {},
  seed?: number | string,
): AutoMovieArchetype<
  createSqueezeTube.Affordance,
  createSqueezeTube.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createSqueezeTube.Affordance>> =
    GroomingPropDraw.prepare<createSqueezeTube.Affordance>(
      "tube",
      params,
      seed,
    );
  const length: number = d.length!;
  const width: number = d.width!;

  // A tube: a body and a cap at its far end; the cap's 15 mm length is authored.
  const cap: number = 0.015;
  builder.rod(
    "body",
    width / 2,
    Vector3.create(0, width / 2, 0),
    Vector3.create(0, width / 2, length - cap),
    { color: "#e9e2d0" },
  );
  builder.rod(
    "cap",
    width * 0.3,
    Vector3.create(0, width / 2, length - cap),
    Vector3.create(0, width / 2, length),
    { color: "#b9b2a0" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, width / 2, (length - cap) / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: width,
    length: length - cap,
  });
  builder.affordance({
    id: "cap",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, width / 2, length - cap / 2),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: width * 0.6,
    travel: 720,
    parts: ["cap"],
  });
  builder.affordance({
    id: "face",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, width / 2, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createSqueezeTube}. */
export namespace createSqueezeTube {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "cap" | "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "width";
}
