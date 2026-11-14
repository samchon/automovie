import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's tap reads as, not read at a source. */
const MAKER: string =
  "a common maker's single-lever mixer tap, not read at a source";

/**
 * A single-lever mixer tap of a sink or a basin.
 *
 * It stands on the counter at the origin, its body rising along `+Y` and its spout reaching out along `+Z` over the basin, toward whoever uses it. `lever` is the lever's hub on the body's top, a knob turned about its upright axis, `+Y` up toward the hand that comes from above; `spout` the spout's mouth, facing down, where the water comes out and a hand or a glass is held under.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tap.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tap stands, which way the spout reaches and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A body rod of the drawn height and diameter, a spout rod from its upper part out to the drawn reach, and a lever box on its top that turns with the `lever` knob.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the body, the spout, the lever, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lever turns but does not tilt, so the flow is not modelled; the spout's and lever's sizes and the lever's turn are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTap(
  params: createTap.IParams = {},
  seed?: number | string,
): Archetype<createTap.Affordance, createTap.Dimension> {
  const d: Record<createTap.Dimension, number> = ArchetypeDraw.dimensions(
    "tap",
    createTap.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createTap.Affordance, createTap.Dimension> =
    new ArchetypeBuilder({
      archetype: "tap",
      id: params.id,
      name: "mixer tap",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter / 2;
  const spout: number = createTap.SPOUT;
  const at: number = d.height - 2 * spout;
  builder.rod("body", r, v(0, 0, 0), v(0, d.height, 0), { color: "#c9ccd1" });
  builder.rod("spout", spout / 2, v(0, at, 0), v(0, at, d.reach), {
    color: "#c9ccd1",
  });
  builder.box("lever", v(0.015, 0.012, 0.09), v(0, d.height + 0.006, -0.02), {
    color: "#b9bcc0",
  });
  builder.affordance({
    id: "lever",
    kind: "knob",
    frame: ArchetypeFrame.facing(
      v(0, d.height + 0.012, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.015,
    travel: createTap.TURN,
    parts: ["lever"],
  });
  builder.affordance({
    id: "spout",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      v(0, at - spout / 2, d.reach - spout / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createTap}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension a maker varies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lever a hand turns and the spout a hand is held under.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read, so every band is provisional; the spout's diameter and the lever's turn are named estimates.
 */
export namespace createTap {
  /** The spout's diameter, metres: an estimate. */
  export const SPOUT: number = 0.02;

  /** The lever's turn from cold to hot, degrees: an estimate. */
  export const TURN: number = 90;

  /**
   * The affordance ids:
   *
   * - `lever`: the lever's hub, a knob turned about `+Y`.
   * - `spout`: the spout's mouth, facing down.
   */
  export type Affordance = "lever" | "spout";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the body's top above the counter.
   * - `diameter`: the body's.
   * - `reach`: the spout's mouth out from the body's axis.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "reach" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `tap` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(0.15, 0.3, MAKER, true),
    diameter: ArchetypeBand.metres(0.035, 0.05, MAKER, true),
    reach: ArchetypeBand.metres(0.12, 0.22, MAKER, true),
    mass: ArchetypeBand.of("kg", 0.8, 2, MAKER, true),
  };
}
