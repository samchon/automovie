import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A spinning lure's size and weight, from a maker's catalogue seen in search
 * results.
 */
const LURE: string =
  "Mepps Aglia spinners, sizes 0 to 5: blade lengths about 2 to 5 cm and weights 2.5 to 13 g, catalogue figures seen only in search results; a lure's body drawn as one block (provisional)";

/**
 * A small fishing lure: a body the line ties to at its `eye`, cast from a rod's
 * tip and drawn back through the water.
 *
 * It lies at the origin along `+Z`, the eye at its front end.
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The lure.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createLure(
  params: createLure.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createLure.Affordance, createLure.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createLure.Dimension> =
    new AutoMovieArchetypeDrawSession<createLure.Dimension>(
      "lure",
      createLure.UNITS,
      seed,
      params,
    );
  const d: Record<createLure.Dimension, number> = draw.dimensions(
    createLure.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createLure.Affordance,
    createLure.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "lure",
    draw,
  });
  const width: number = d.length / 4;
  builder.box(
    "body",
    Vector3.create(width, width, d.length),
    Vector3.create(0, 0, 0),
    { color: "#c0c4c8" },
  );
  builder.affordance({
    id: "eye",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, d.length / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createLure}. */
export namespace createLure {
  /** The contact: the eye the line ties to. */
  export type Affordance = "eye";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "length" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.02, 0.05, LURE),
    mass: AutoMovieArchetypeBand.of("kg", 0.0025, 0.013, LURE),
  };
}
