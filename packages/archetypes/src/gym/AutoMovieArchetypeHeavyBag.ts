import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The bags, from a search only. */
const EVERLAST: string =
  "Everlast 100 lb hanging bags: Powershot about 59 in tall and 14.5 in across, Powerlock 46 in and 13 in, NevaTear 53 in and 13.25 in, as search results give Everlast's and retailers' listings; not read";

/** Constructs the heavy bag archetype from its recipe. */
export namespace AutoMovieArchetypeHeavyBag {
/**
 * A hanging heavy bag: a cylinder of the drawn height and diameter hanging from
 * its hook.
 *
 * It hangs from its `hook` at the origin, the middle of its top, the bag below
 * it along `-Y`; the chain is the placement's, since no listing read gives its
 * length; the side struck faces `+Z`. `target` is the bag's face at its middle
 * height, a surface along `+Z` a punch or a kick lands on, `+X` across the bag
 * and its depth the bag's height; `hook` is the hanging point, `+Y` up. Where
 * the hook hangs, a ceiling's or a stand's, is the placement's.
 *
 * A bag swinging after a hit is the force law of #3417, not this archetype's.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The heavy bag.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeHeavyBag.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHeavyBag.Affordance, AutoMovieArchetypeHeavyBag.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHeavyBag.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHeavyBag.Dimension>(
      "heavyBag",
      AutoMovieArchetypeHeavyBag.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeHeavyBag.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeHeavyBag.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHeavyBag.Affordance,
    AutoMovieArchetypeHeavyBag.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "heavy bag",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const top: number = 0;
  const radius: number = d.diameter / 2;
  builder.rod("bag", radius, v(0, top, 0), v(0, top - d.height, 0), {
    color: "#2b2b2e",
  });
  builder.affordance({
    id: "target",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top - d.height / 2, radius),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.diameter,
    depth: d.height,
  });
  builder.affordance({
    id: "hook",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}
}

/** Companion types and bands of {@link createHeavyBag}. */
export namespace AutoMovieArchetypeHeavyBag {
  /**
   * The affordance ids:
   *
   * - `target`: the struck face at mid-height, `+Y` along `+Z`.
   * - `hook`: the hanging point at the origin.
   */
  export type Affordance = "target" | "hook";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the bag's.
   * - `diameter`: the bag's.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `heavyBag` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      46 * AutoMovieArchetypeUnits.INCH,
      59 * AutoMovieArchetypeUnits.INCH,
      EVERLAST,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      13 * AutoMovieArchetypeUnits.INCH,
      14.5 * AutoMovieArchetypeUnits.INCH,
      EVERLAST,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      100 * AutoMovieArchetypeUnits.POUND,
      100 * AutoMovieArchetypeUnits.POUND,
      `${EVERLAST}: 100 lb`,
      true,
    ),
  };
}
