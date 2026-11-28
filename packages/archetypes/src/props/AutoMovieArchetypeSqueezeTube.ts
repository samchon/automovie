import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./internal/GroomingPropDraw";

/** Constructs an Alltub squeeze tube with a body grip and rotating cap. */
export namespace AutoMovieArchetypeSqueezeTube {

/**
 * Build a squeeze tube laid along `+Z` with its base end at Z zero.
 *
 * The final 0.015 metres are the cap. Its control turns that part around
 * the nozzle axis through 720 degrees. The dispensing frame is fixed
 * at the tube's far end.
 *
 * @param params Optional scene ID, Alltub diameter model, compatible
 *   finite length in metres and mass in kilograms.
 * @param seed Numeric seed for omitted values. Without it the model
 *   is `alltub13_5`, 0.0135 metres across and 0.1025 metres long.
 * @returns The tube with its body `grip`, rotating `cap` and nozzle `face`.
 * @throws {AutoMovieArchetypeRefusal} If the model or fixed value is inadmissible.
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
   * Optional ID, Alltub diameter choice, and otherwise drawn length and mass.
   */
  export interface IParams {
    /** Scene object ID, defaulting to `careItem`. */
    id?: string;
    /** Finite length in metres within the selected diameter's length band. */
    length?: number;
    /** Finite mass in kilograms within the tube band. */
    mass?: number;
    /**
     * Selects one Alltub diameter. Without a model or seed, uses `alltub13_5`.
     */
    model?: Exclude<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  }

  /**
   * Round body `grip`, two-turn `cap` control and fixed axial nozzle `face`.
   */
  export type Affordance = "cap" | "face" | "grip";

  /**
   * Overall Z length and tube diameter as `width`, in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "width";
}
