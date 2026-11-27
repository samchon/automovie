import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeMedalData from "./internal/AutoMovieArchetypeMedalData";

/** Constructs the medal archetype from its recipe. */
export namespace AutoMovieArchetypeMedal {
/**
 * A ribbon medal: a disc on a neck ribbon, presented by the ribbon above the
 * disc and worn with the disc on the breastbone.
 *
 * It hangs from the origin, the ribbon's top, down `-Y`, the disc's face toward
 * `+Z`. `hold` is where fingers take the ribbon just above the disc, as a medal
 * is pinned; `wear` is the disc's back, facing `-Z`, the point laid on the
 * wearer's chest.
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The medal.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeMedal.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMedal.Affordance, AutoMovieArchetypeMedal.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMedal.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeMedal.Dimension>(
      "medal",
      AutoMovieArchetypeMedal.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeMedal.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeMedal.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeMedal.Affordance,
    AutoMovieArchetypeMedal.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "medal",
    draw,
  });
  const thick: number = 0.008;
  builder.box(
    "ribbon",
    Vector3.create(0.035, d.ribbon, 0.002),
    Vector3.create(0, -d.ribbon / 2, 0),
    {
      color: "#1f4fa3",
    },
  );
  builder.rod(
    "disc",
    d.diameter / 2,
    Vector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
    Vector3.create(0, -d.ribbon - d.diameter / 2, thick / 2),
    { color: "#c9a227" },
  );
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, -d.ribbon - 0.02, thick / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "lateral",
    aperture: 0.002,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /** The contacts: the ribbon's top a hand takes, and the disc's worn back. */
  export type Affordance = "hold" | "wear";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "diameter" | "ribbon" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    ribbon: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    diameter: AutoMovieArchetypeBand.metres(0.07, 0.085, AutoMovieArchetypeMedalData.MEDAL),
    ribbon: AutoMovieArchetypeBand.metres(0.4, 0.5, AutoMovieArchetypeMedalData.RIBBON),
    mass: AutoMovieArchetypeBand.of("kg", 0.45, 0.556, AutoMovieArchetypeMedalData.MEDAL),
  };
}
