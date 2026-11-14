import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The World Athletics rule as read. */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 38.8 and 38.10, the javelin";

/**
 * A competition javelin, the men's or the women's.
 *
 * It stands on its point at the origin, the shaft straight up along `+Y` to its tail. `grip` is the cord binding over the centre of gravity, where the throwing hand closes, taken from `-Z`; `point` the metal tip, its `+Y` running out of the javelin, which the throw leads with and the landing plants.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The javelin.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the javelin stands and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod of the drawn length and diameter, and a cord rod a few millimetres thicker, as wide as the rule's cord, centred on the drawn centre of gravity's distance from the point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, shaft, cord, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shaft is a cylinder, not tapered to the point and the tail; the cord's thickness is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createJavelin(
  params: createJavelin.IParams,
  seed?: number | string,
): Archetype<createJavelin.Affordance, createJavelin.Dimension> {
  const kind: createJavelin.Kind = ArchetypeDraw.choice(
    "javelin",
    "kind",
    params.kind,
    createJavelin.KINDS,
  );
  const d: Record<createJavelin.Dimension, number> = ArchetypeDraw.dimensions(
    "javelin",
    createJavelin.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createJavelin.Affordance,
    createJavelin.Dimension
  > = new ArchetypeBuilder({
    archetype: "javelin",
    id: params.id,
    name: `${kind}'s javelin`,
    dimensions: d,
  });
  const cord: number = d.diameter + 2 * createJavelin.CORD;
  const width: number = createJavelin.CORD_WIDTH[kind];
  builder.rod(
    "shaft",
    d.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.length, 0),
    { color: "#c9ccd1" },
  );
  builder.rod(
    "cord",
    cord / 2,
    Vector3.create(0, d.balance - width / 2, 0),
    Vector3.create(0, d.balance + width / 2, 0),
    { color: "#2c2f33" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createJavelin}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The two senior categories and one band per dimension each, the rule's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cord a hand takes and the point a throw leads with.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is the rule as read; where the rule gives only a minimum mass or a maximum length, the model takes that limit; the cord's thickness is a named estimate.
 */
export namespace createJavelin {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The cord's thickness over the shaft, metres: an estimate inside Technical Rule 38.8's 8 mm over the shaft's diameter. */
  export const CORD: number = 0.003;

  /** The cord's width along the shaft, metres, by category: the rule's 150 to 160 mm and 140 to 150 mm, their middles. */
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

  /** The parameters: the category, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `javelin` when absent. */
    id?: string;
  }

  /** A band in metres of the rule. */
  const m = (minimum: number, maximum: number, what: string): IArchetypeBand =>
    ArchetypeBand.metres(minimum, maximum, `${RULE}: ${what}`);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
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
      mass: ArchetypeBand.of(
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
      mass: ArchetypeBand.of(
        "kg",
        0.6,
        0.6,
        `${RULE}: the women's at least 600 g for admission, the minimum the model takes`,
      ),
    },
  };
}
