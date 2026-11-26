import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The World Athletics rule as read. */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 38.8 and 38.10, the javelin";

/** Canonical producer and authoring contract for Javelin. */
export namespace AutoMovieArchetypeJavelin {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /**
   * The cord's thickness over the shaft, metres: an estimate inside Technical
   * Rule 38.8's 8 mm over the shaft's diameter.
   */
  export const CORD: number = 0.003;

  /**
   * The cord's width along the shaft, metres, by category: the rule's 150 to
   * 160 mm and 140 to 150 mm, their middles.
   */
  export const CORD_WIDTH: Readonly<Record<Kind, number>> = {
    men: 0.155,
    women: 0.145,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the cord over the centre of gravity, taken from `-Z`.
   * - `point`: the tip, its `+Y` out of the javelin.
   */
  export type Affordance = "grip" | "point";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the point to the tail.
   * - `diameter`: the shaft's, at its thickest.
   * - `balance`: the centre of gravity's distance from the point.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "balance" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    balance: "m",
    mass: "kg",
  };

  /**
   * The parameters: the category, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `javelin` when absent. */
    id?: string;
  }

  /** A band in metres of the rule. */
  const m = (
    minimum: number,
    maximum: number,
    what: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, `${RULE}: ${what}`);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      length: m(2.6, 2.7, "the men's 2.60 to 2.70 m long"),
      diameter: m(
        0.025,
        0.03,
        "the men's shaft 25 to 30 mm across at its thickest",
      ),
      balance: m(
        0.9,
        1.06,
        "the men's centre of gravity 0.90 to 1.06 m from the point",
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.8,
        0.8,
        `${RULE}: the men's at least 800 g for admission, the minimum the model takes`,
      ),
    },
    women: {
      length: m(2.2, 2.3, "the women's 2.20 to 2.30 m long"),
      diameter: m(
        0.02,
        0.025,
        "the women's shaft 20 to 25 mm across at its thickest",
      ),
      balance: m(
        0.8,
        0.92,
        "the women's centre of gravity 0.80 to 0.92 m from the point",
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.6,
        0.6,
        `${RULE}: the women's at least 600 g for admission, the minimum the model takes`,
      ),
    },
  };

  /**
   * A competition javelin, the men's or the women's.
   *
   * It stands on its point at the origin, the shaft straight up along `+Y` to its
   * tail. `grip` is the cord binding over the centre of gravity, where the
   * throwing hand closes, taken from `-Z`; `point` the metal tip, its `+Y`
   * running out of the javelin, which the throw leads with and the landing
   * plants.
   *
   * @param params The category and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The javelin.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeJavelin.IParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeJavelin.Affordance, AutoMovieArchetypeJavelin.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeJavelin.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeJavelin.Dimension>(
        "javelin",
        AutoMovieArchetypeJavelin.UNITS,
        seed,
        params,
      );
    const kind: AutoMovieArchetypeJavelin.Kind = ArchetypeDraw.choice(
      "javelin",
      "kind",
      params.kind,
      AutoMovieArchetypeJavelin.KINDS,
    );
    const d: Record<AutoMovieArchetypeJavelin.Dimension, number> = draw.dimensions(
      AutoMovieArchetypeJavelin.BANDS[kind],
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeJavelin.Affordance,
      AutoMovieArchetypeJavelin.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: `${kind}'s javelin`,
      draw,
    });
    const cord: number = d.diameter + 2 * AutoMovieArchetypeJavelin.CORD;
    const width: number = AutoMovieArchetypeJavelin.CORD_WIDTH[kind];
    // The shaft in two lengths meeting at the drawn centre of gravity, their mass shares chosen so the whole balances there as the rule places it: the fore length's middle is `balance / 2` from the point and the aft's `(balance + length) / 2`, so the aft carries `balance / length` of the mass and the fore the rest; the cord sits on the balance point and carries none, its mass unread.
    const aft: number = d.balance / d.length;
    builder.rod(
      "shaft",
      d.diameter / 2,
      Vector3.create(0, 0, 0),
      Vector3.create(0, d.balance, 0),
      { color: "#c9ccd1", share: 1 - aft },
    );
    builder.rod(
      "tail",
      d.diameter / 2,
      Vector3.create(0, d.balance, 0),
      Vector3.create(0, d.length, 0),
      { color: "#c9ccd1", share: aft },
    );
    builder.rod(
      "cord",
      cord / 2,
      Vector3.create(0, d.balance - width / 2, 0),
      Vector3.create(0, d.balance + width / 2, 0),
      { color: "#2c2f33", share: 0 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, d.balance, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: cord,
      length: width,
    });
    builder.affordance({
      id: "point",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, 0, 0),
        Vector3.create(0, -1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass);
  }
}
