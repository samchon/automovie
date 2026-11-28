import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { createLaptop } from "./internal/createLaptop";

/** A laptop from the measured Air models and their input contacts. */
export namespace AutoMovieArchetypeLaptop {
  /**
   * Build a laptop with a fixed keyboard and a moving display.
   *
   * The base is centred with its typing edge toward +Z. The display starts open
   * at 110 degrees to the deck. The hinge turns up to 110 degrees about the
   * rear pivot to close. The screen and lid grasp follow it.
   *
   * @param params The manufacturer's model and optional model identifier.
   * @param seed The seed used to select a model when omitted.
   * @returns The input device and its named contacts.
   * @throws {AutoMovieArchetypeRefusal} When the requested input is
   *   inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeLaptop.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeLaptop.Affordance,
    AutoMovieArchetypeLaptop.Dimension
  > {
    return createLaptop<"hinge">(params, seed, (builder, pivot, tilt) => {
      builder.affordance({
        id: "hinge",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(pivot, { x: 1, y: 0, z: 0 }),
        extent: null,
        travel: tilt,
        parts: ["lid"],
      });
      return "hinge";
    });
  }

  /** The two manufacturer models the producer admits. */
  export type Model = "air13" | "air15";

  /** The model's lengths in metres and mass in kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** Named contacts on the fixed deck and its articulated display. */
  export type Affordance = "homeRow" | "keys" | "hinge" | Display;

  /** The display's carried sites: the reading surface and lid grasp. */
  export type Display = "screen" | "lid";

  /** The scene identity and hardware selector. */
  export interface IParams {
    /** Optional model identifier used by the scene. */
    id?: string;

    /** The manufacturer model, selected with the seed when omitted. */
    model?: Model;
  }
}
