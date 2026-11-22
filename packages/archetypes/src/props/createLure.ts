import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** A spinning lure's size and weight, from a maker's catalogue seen in search results. */
const LURE: string =
  "Mepps Aglia spinners, sizes 0 to 5: blade lengths about 2 to 5 cm and weights 2.5 to 13 g, catalogue figures seen only in search results; a lure's body drawn as one block (provisional)";

/**
 * A small fishing lure: a body the line ties to at its `eye`, cast from a
 * rod's tip and drawn back through the water.
 *
 * It lies at the origin along `+Z`, the eye at its front end.
 *
 * @param params Any dimension the author fixes inside its band, and an optional scene id.
 * @param seed The seed that draws every dimension left free inside its band; absent, the middle of each band.
 * @returns The lure.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, how it lies and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation One block of the drawn length and mass with the eye at its front.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, build the body, the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The blade and hooks are drawn as one body, marked provisional.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

/**
 * Companion types, constants and bands of {@link createLure}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each dimension and contact states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and sourced bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the producer and its callers read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bands are the catalogue's, the block shape provisional.
 */
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
