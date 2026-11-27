import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./internal/GroomingPropDraw";

/** Creates a squeeze tube archetype with a body grip and an operable cap. */
export namespace AutoMovieArchetypeSqueezeTube {

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
export function create(
  params: AutoMovieArchetypeSqueezeTube.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeSqueezeTube.Affordance,
  AutoMovieArchetypeSqueezeTube.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<AutoMovieArchetypeSqueezeTube.Affordance>> =
    GroomingPropDraw.prepare<AutoMovieArchetypeSqueezeTube.Affordance>(
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
    AutoMovieEngineVector3.create(0, width / 2, 0),
    AutoMovieEngineVector3.create(0, width / 2, length - cap),
    { color: "#e9e2d0" },
  );
  builder.rod(
    "cap",
    width * 0.3,
    AutoMovieEngineVector3.create(0, width / 2, length - cap),
    AutoMovieEngineVector3.create(0, width / 2, length),
    { color: "#b9b2a0" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, width / 2, (length - cap) / 2),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
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
      AutoMovieEngineVector3.create(0, width / 2, length - cap / 2),
      AutoMovieEngineVector3.create(0, 0, 1),
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
      AutoMovieEngineVector3.create(0, width / 2, length),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}


  /* The contacts and dimensions of {@link AutoMovieArchetypeSqueezeTube}. */
  /**
   * The original producer parameters.
   */
  export interface IParams {
    /** The squeeze tube identifier, unique within its scene. */
    id?: string;
    /** The tube length in metres when fixed by the author. */
    length?: number;
    /** The tube mass in kilograms when fixed by the author. */
    mass?: number;
    /** An Alltub laminate tube model; omitted for seeded selection. */
    model?: Exclude<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  }

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
