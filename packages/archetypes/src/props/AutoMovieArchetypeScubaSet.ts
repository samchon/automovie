import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** No maker's page was read. */
const STAGED: string =
  "a scuba set: its dimensions and mass are provisional estimates, no maker's page was read";

/** Constructs the scuba set archetype from its recipe. */
export namespace AutoMovieArchetypeScubaSet {
/**
 * A scuba cylinder on a buoyancy jacket, with its first-stage regulator. Its
 * origin is the jacket's back plate centre, `+Z` out of the diver's back and
 * `+Y` toward the head. `wear` is the jacket's inside, `+Y` toward the diver's
 * back; `regulator` is the second stage the mouth takes.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The item with its contacts.
 */
export function create(
  params: AutoMovieArchetypeScubaSet.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeScubaSet.Affordance, AutoMovieArchetypeScubaSet.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeScubaSet.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "scubaSet",
      AutoMovieArchetypeScubaSet.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeScubaSet.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeScubaSet.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeScubaSet.Affordance,
    AutoMovieArchetypeScubaSet.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a scuba set",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod(
    "cylinder",
    d.diameter / 2,
    v(0, -d.length / 2, 0.02 + d.diameter / 2),
    v(0, d.length / 2, 0.02 + d.diameter / 2),
    { color: "#c8cdd1" },
  );
  builder.box("jacket", v(0.36, 0.5, 0.06), v(0, 0, -0.03), {
    color: "#1f2a36",
  });
  builder.ball(
    "first-stage",
    0.035,
    v(0, d.length / 2 + 0.03, 0.02 + d.diameter / 2),
    {
      color: "#6b7177",
    },
  );
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, -0.06),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "regulator",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0.1, d.length / 2 + 0.05, -0.15)),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and the socket of {@link createScubaSet}. */
  /** The jacket on the back, and the second stage at the mouth. */
  export type Affordance = "wear" | "regulator";

  /** The cylinder's length and diameter, and the set's mass. */
  export type Dimension = "length" | "diameter" | "mass";

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
    diameter: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.6, 0.7, STAGED, true),
    diameter: AutoMovieArchetypeBand.metres(0.17, 0.19, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 15, 20, STAGED, true),
  };
}
