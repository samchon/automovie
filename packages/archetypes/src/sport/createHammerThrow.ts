import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** World Athletics' implement rule as recalled, not read here. */
const RULE: string = "World Athletics Technical Rules, the hammer";

/**
 * A competition hammer of the hammer throw, the men's or the women's: a metal head on a steel wire with a two-hand handle.
 *
 * It stands on its head with the wire straight up along `+Y`, the handle level along `X` at the top. `handle` is the loop both hands close on; `head` the ball's centre, its `+Y` out along the wire's line away from the handle, the end a swing whirls.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The hammer.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the hammer stands and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A head sphere of the drawn diameter, a wire rod up from its top and a handle rod across the top, the drawn length from the head's bottom to the handle's inside.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, three parts, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wire is rigid and straight, as the hammer is when whirled; the handle is a straight bar, not a triangular loop; the wire's and the handle's sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHammerThrow(
  params: createHammerThrow.IParams,
  seed?: number | string,
): Archetype<createHammerThrow.Affordance, createHammerThrow.Dimension> {
  const kind: createHammerThrow.Kind = ArchetypeDraw.choice(
    "hammerThrow",
    "kind",
    params.kind,
    createHammerThrow.KINDS,
  );
  const d: Record<createHammerThrow.Dimension, number> =
    ArchetypeDraw.dimensions(
      "hammerThrow",
      createHammerThrow.BANDS[kind],
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createHammerThrow.Affordance,
    createHammerThrow.Dimension
  > = new ArchetypeBuilder({
    archetype: "hammerThrow",
    id: params.id,
    name: `${kind}'s hammer`,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter / 2;
  const bar: number = createHammerThrow.HANDLE;
  const top: number = d.length + bar / 2;
  builder.ball("head", radius, v(0, radius, 0), { color: "#4a4d52" });
  builder.rod(
    "wire",
    createHammerThrow.WIRE / 2,
    v(0, d.diameter, 0),
    v(0, d.length, 0),
    { color: "#8a8d91" },
  );
  builder.rod(
    "handle",
    bar / 2,
    v(-createHammerThrow.HANDLE_WIDTH / 2, top, 0),
    v(createHammerThrow.HANDLE_WIDTH / 2, top, 0),
    { color: "#2c2f33" },
  );
  builder.affordance({
    id: "handle",
    kind: "bar",
    frame: ArchetypeFrame.facing(v(0, top, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    grip: "two-hand",
    aperture: bar,
    length: createHammerThrow.HANDLE_WIDTH,
  });
  builder.affordance({
    id: "head",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, radius, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createHammerThrow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The two senior categories and one band per dimension each, the rule's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle the hands take and the head a swing whirls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rule was recalled and not read here, so every band is provisional; the wire's and the handle's sizes are named estimates.
 */
export namespace createHammerThrow {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The wire's diameter, metres: the rule's at least 3 mm, an estimate. */
  export const WIRE: number = 0.003;

  /** The handle's diameter, metres: an estimate. */
  export const HANDLE: number = 0.012;

  /** The handle's width across the hands, metres: an estimate. */
  export const HANDLE_WIDTH: number = 0.11;

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

  /** The parameters: the category, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `hammerThrow` when absent. */
    id?: string;
  }

  /** A provisional band of the rule. */
  const band = (
    unit: IArchetypeBand["unit"],
    minimum: number,
    maximum: number,
    what: string,
  ): IArchetypeBand =>
    ArchetypeBand.of(unit, minimum, maximum, `${RULE}: ${what}`, true);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    men: {
      length: band(
        "m",
        1.175,
        1.215,
        "the men's 1175 to 1215 mm from the head to the handle's inside",
      ),
      diameter: band("m", 0.11, 0.13, "the men's head 110 to 130 mm across"),
      mass: band(
        "kg",
        7.26,
        7.285,
        "the men's at least 7.26 kg; the upper end is a maker's tolerance",
      ),
    },
    women: {
      length: band(
        "m",
        1.16,
        1.195,
        "the women's 1160 to 1195 mm from the head to the handle's inside",
      ),
      diameter: band("m", 0.095, 0.11, "the women's head 95 to 110 mm across"),
      mass: band(
        "kg",
        4,
        4.025,
        "the women's at least 4 kg; the upper end is a maker's tolerance",
      ),
    },
  };
}
