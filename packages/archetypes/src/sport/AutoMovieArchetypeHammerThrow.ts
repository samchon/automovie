import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBandUnit,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/*
 * The World Athletics rule as read.
 */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 36.6 and 36.8, the hammer";

/** Canonical producer and authoring contract for Hammer Throw. */
export namespace AutoMovieArchetypeHammerThrow {
  /** The categories. */
  export type Kind = "men" | "women";

  /**
   * The affordance ids:
   *
   * - `handle`: the handle, a bar along `X` taken from above.
   * - `head`: the head's centre, its `+Y` along the wire away from the handle.
   */
  export type Affordance = "handle" | "head";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the head's bottom to the handle's inside.
   * - `diameter`: the head's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /**
   * The parameters: the category, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `hammerThrow` when absent. */
    id?: string;
  }

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The wire's diameter, metres: the rule's at least 3 mm, an estimate. */
  export const WIRE: number = 0.003;

  /** The handle's diameter, metres: an estimate. */
  export const HANDLE: number = 0.012;

  /** The handle's width across the hands, metres: an estimate. */
  export const HANDLE_WIDTH: number = 0.11;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /*
   * A band of the rule.
   */
  const band = (
    unit: AutoMovieArchetypeBandUnit,
    minimum: number,
    maximum: number,
    what: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of(unit, minimum, maximum, `${RULE}: ${what}`);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      length: band(
        "m",
        1.215,
        1.215,
        "the men's at most 1215 mm measured from the inside of the handle, the limit the model takes",
      ),
      diameter: band("m", 0.11, 0.13, "the men's head 110 to 130 mm across"),
      mass: band(
        "kg",
        7.26,
        7.26,
        "the men's at least 7.26 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      length: band(
        "m",
        1.195,
        1.195,
        "the women's at most 1195 mm measured from the inside of the handle, the limit the model takes",
      ),
      diameter: band("m", 0.095, 0.11, "the women's head 95 to 110 mm across"),
      mass: band(
        "kg",
        4,
        4,
        "the women's at least 4 kg for admission, the minimum the model takes",
      ),
    },
  };

  /**
   * A competition hammer of the hammer throw, the men's or the women's: a metal
   * head on a steel wire with a two-hand handle.
   *
   * It stands on its head with the wire straight up along `+Y`, the handle level
   * along `X` at the top. `handle` is the loop both hands close on; `head` the
   * ball's centre, its `+Y` out along the wire's line away from the handle, the
   * end a swing whirls.
   *
   * @param params The category and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The hammer.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeHammerThrow.IParams,
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeHammerThrow.Affordance,
    AutoMovieArchetypeHammerThrow.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHammerThrow.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHammerThrow.Dimension>(
        "hammerThrow",
        AutoMovieArchetypeHammerThrow.UNITS,
        seed,
        params,
      );
    const kind: AutoMovieArchetypeHammerThrow.Kind = ArchetypeDraw.choice(
      "hammerThrow",
      "kind",
      params.kind,
      AutoMovieArchetypeHammerThrow.KINDS,
    );
    const d: Record<AutoMovieArchetypeHammerThrow.Dimension, number> = draw.dimensions(
      AutoMovieArchetypeHammerThrow.BANDS[kind],
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeHammerThrow.Affordance,
      AutoMovieArchetypeHammerThrow.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: `${kind}'s hammer`,
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.diameter / 2;
    const bar: number = AutoMovieArchetypeHammerThrow.HANDLE;
    const top: number = d.length + bar / 2;
    builder.ball("head", radius, v(0, radius, 0), { color: "#4a4d52" });
    builder.rod(
      "wire",
      AutoMovieArchetypeHammerThrow.WIRE / 2,
      v(0, d.diameter, 0),
      v(0, d.length, 0),
      { color: "#8a8d91" },
    );
    builder.rod(
      "handle",
      bar / 2,
      v(-AutoMovieArchetypeHammerThrow.HANDLE_WIDTH / 2, top, 0),
      v(AutoMovieArchetypeHammerThrow.HANDLE_WIDTH / 2, top, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(v(0, top, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "two-hand",
      aperture: bar,
      length: AutoMovieArchetypeHammerThrow.HANDLE_WIDTH,
    });
    builder.affordance({
      id: "head",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, radius, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass);
  }
}
