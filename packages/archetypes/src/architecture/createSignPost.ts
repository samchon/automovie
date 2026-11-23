import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/** The estimated thickness of the sign blank, metres. */
const BLANK_THICKNESS: number = 0.003;

/**
 * An upright square post carrying a STOP sign blank above its grip span.
 *
 * The sign faces +Z, and its measured lower edge bounds the upright post contact.
 * The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier, model choice and supported dimension overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the selected profile.
 */
export function createSignPost(
  params: createSignPost.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSignPost.Affordance, createSignPost.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<createSignPost.Affordance> =
    StreetFixtureDraw.begin("signPost", "sign post", "composite", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const bottom: number = d.height!;
  const size: number = d.head!;
  const side: number = d.diameter!;
  builder.box(
    "post",
    v(side, bottom + size, side),
    v(0, (bottom + size) / 2, 0),
    {
      color: "#9aa1a8",
    },
  );
  builder.box(
    "sign",
    v(size, size, BLANK_THICKNESS),
    v(0, bottom + size / 2, side / 2 + BLANK_THICKNESS / 2),
    { color: "#c8102e" },
  );
  builder.affordance({
    id: "post",
    kind: "bar",
    symmetry: "half",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, bottom / 2, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: side,
    length: bottom,
  });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createSignPost}.
 */
export namespace createSignPost {
  /** The `model` choices this producer admits. */
  export type Model = "STOP 30 in" | "STOP 36 in";

  /** The named contacts built by this producer. */
  export type Affordance = "post";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height" | "diameter" | "mass";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "head" | "height" | "mass";

  /** The numeric overrides and optional scene identifier. The model fixes the size of the sign blank. */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The STOP road class, drawn from the seed when omitted. */
    model?: Model;
  }
}
