import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeLureData } from "./internal/AutoMovieArchetypeLureData";

/** Constructs the lure archetype from its recipe. */
export namespace AutoMovieArchetypeLure {
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
export function create(
  params: AutoMovieArchetypeLure.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLure.Affordance, AutoMovieArchetypeLure.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLure.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLure.Dimension>(
      "lure",
      AutoMovieArchetypeLure.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeLure.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLure.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLure.Affordance,
    AutoMovieArchetypeLure.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "lure",
    draw,
  });
  const width: number = d.length / 4;
  builder.box(
    "body",
    AutoMovieEngineVector3.create(width, width, d.length),
    AutoMovieEngineVector3.create(0, 0, 0),
    { color: "#c0c4c8" },
  );
  builder.affordance({
    id: "eye",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, 0, d.length / 2),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

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
    length: AutoMovieArchetypeBand.metres(0.02, 0.05, AutoMovieArchetypeLureData.LURE),
    mass: AutoMovieArchetypeBand.of("kg", 0.0025, 0.013, AutoMovieArchetypeLureData.LURE),
  };
}
