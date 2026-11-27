import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeSnorkelData } from "./internal/AutoMovieArchetypeSnorkelData";

/** Constructs the snorkel archetype from its recipe. */
export namespace AutoMovieArchetypeSnorkel {
/**
 * A J snorkel worn beside the head. Its origin is the mouthpiece, `+Y` up along
 * the barrel and `+Z` out of the mouth. `wear` is the mouthpiece the mouth
 * closes on; `top` is the barrel's open top, which must stay above the surface
 * while the swimmer breathes through it.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The item with its contacts.
 */
export function create(
  params: AutoMovieArchetypeSnorkel.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSnorkel.Affordance, AutoMovieArchetypeSnorkel.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSnorkel.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "snorkel",
      AutoMovieArchetypeSnorkel.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeSnorkel.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSnorkel.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSnorkel.Affordance,
    AutoMovieArchetypeSnorkel.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a snorkel",
    material: "rubber",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  builder.rod("barrel", 0.011, v(0.04, 0, -0.03), v(0.04, d.length, -0.03), {
    color: "#f2c230",
  });
  builder.rod("mouthpiece", 0.011, v(0, 0, 0), v(0.04, 0, -0.03), {
    color: "#1f2a36",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "top",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0.04, d.length, -0.03)),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and the socket of {@link createSnorkel}. */
  /** The mouthpiece, and the barrel's open top. */
  export type Affordance = "wear" | "top";

  /** The barrel's height above the mouthpiece, and the mass. */
  export type Dimension = "length" | "mass";

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
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.32, 0.4, AutoMovieArchetypeSnorkelData.STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.1, 0.2, AutoMovieArchetypeSnorkelData.STAGED, true),
  };
}
