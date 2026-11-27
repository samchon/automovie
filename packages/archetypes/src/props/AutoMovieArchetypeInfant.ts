import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** Newborn proportions read from a growth chart are not yet applied. */
const STAGED: string =
  "a swaddled infant: a coarse newborn-sized bundle, its dimensions and mass provisional estimates";

/** Constructs the infant archetype from its recipe. */
export namespace AutoMovieArchetypeInfant {
/**
 * A swaddled infant: a coarse bundle with a head, carried as a prop. Its origin
 * is the seat, the bottom of the bundle, with `+Y` along the body toward the
 * head and `+Z` out of the face. `seat` is where a hand takes the bundle from
 * below; `nape` and `back` are the support sites behind the neck and the back,
 * facing `-Z`; `mouth` is the teat's place, facing `+Z`; `head` the head's
 * centre.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The bundle with its sites.
 */
export function create(
  params: AutoMovieArchetypeInfant.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeInfant.Affordance, AutoMovieArchetypeInfant.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeInfant.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "infant",
      AutoMovieArchetypeInfant.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeInfant.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeInfant.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeInfant.Affordance,
    AutoMovieArchetypeInfant.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a swaddled infant",
    material: "fabric",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.head / 2;
  const body: number = d.length - d.head;
  const half: number = 0.06;
  builder.box("bundle", v(0.14, body, 2 * half), v(0, body / 2, 0), {
    color: "#e9e1d3",
    share: 0.75,
  });
  builder.ball("head", r, v(0, body + r, 0), { color: "#e7c1a3", share: 0.25 });
  builder.affordance({
    id: "seat",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: 2 * half,
    length: 0.14,
  });
  builder.affordance({
    id: "nape",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body, -half),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    width: 0.08,
  });
  builder.affordance({
    id: "back",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body * 0.55, -half),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    width: 0.12,
  });
  builder.affordance({
    id: "mouth",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body + r * 0.8, r * 0.9),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "head",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, body + r, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}
}

/** Dimensions and sites of {@link createInfant}. */
export namespace AutoMovieArchetypeInfant {
  /** The seat, the support sites, the mouth and the head. */
  export type Affordance = "seat" | "nape" | "back" | "mouth" | "head";

  /** The crown-to-seat length, the head's diameter and the mass. */
  export type Dimension = "length" | "head" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    head: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.42, 0.5, STAGED, true),
    head: AutoMovieArchetypeBand.metres(0.11, 0.13, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 3, 5, STAGED, true),
  };
}
