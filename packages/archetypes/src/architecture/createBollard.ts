import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/**
 * A ground-standing steel bollard with a shaft grip and a top surface.
 *
 * The installed height and selected Reliance pipe diameter supply the shaft,
 * its bar and its top support. The lowest point of the fixture stands on Y =
 * 0.
 *
 * @param params The scene identifier, model choice and supported dimension
 *   overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createBollard(
  params: createBollard.IParams = {},
  seed?: number,
): AutoMovieArchetype<createBollard.Affordance, createBollard.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<createBollard.Affordance> =
    StreetFixtureDraw.begin("bollard", "bollard", "steel", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  builder.rod("shaft", diameter / 2, v(0, 0, 0), v(0, height, 0), {
    color: "#e2b714",
    surface: "steel",
  });
  StreetFixtureDraw.shaft(builder, 0, height, diameter);
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    width: diameter,
    depth: diameter,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

/** Inputs, dimensions and contacts for {@link createBollard}. */
export namespace createBollard {
  /** The `model` choices this producer admits. */
  export type Model = "R-1007-04" | "R-1007-06" | "R-1007-08" | "R-1007-10";

  /** The named contacts built by this producer. */
  export type Affordance = "post" | "top";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /**
   * The numeric overrides and optional scene identifier. The model fixes the
   * pipe diameter and mass.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured pipe model, drawn from the seed when omitted. */
    model?: Model;
  }
}
