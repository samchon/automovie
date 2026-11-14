import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's taps, read. */
const GROHE: string =
  "GROHE Eurosmart single-lever basin mixers, S-size: 146 to 169 mm high, the outlet 56 to 95 mm high, a projection of 106 to 109 mm (https://weinmann-schanz.de/de/en/Plumbing/Brand-search/Grohe/Bath-fittings/Series/Eurosmart/Grohe-Eurosmart-S-size-washbasin-mixer-sid1384227.html, https://www.galaxus.de/en/s4/product/grohe-eurosmart-single-lever-basin-mixer-s-size-bathroom-fittings-11042650)";

/** What no source read gives. */
const UNREAD: string = "the listings read do not give it";

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
 * @evidence contracts/development/implementation.md#principled-implementation A body rod of the drawn height and diameter, a spout rod at the drawn outlet's height out to the drawn reach, and a lever box on its top that turns with the `lever` knob.
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
  const at: number = d.outlet + spout / 2;
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The height, the outlet's height and the projection are the maker's as read; the body's diameter and the weight are given by none, so they are provisional; the spout's diameter and the lever's turn are named estimates.
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
   * - `outlet`: the spout's mouth above the counter.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "reach" | "outlet" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `tap` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(0.146, 0.169, GROHE),
    diameter: ArchetypeBand.metres(0.035, 0.05, `the body's diameter: ${UNREAD}`, true),
    reach: ArchetypeBand.metres(0.106, 0.109, GROHE),
    outlet: ArchetypeBand.metres(0.056, 0.095, GROHE),
    mass: ArchetypeBand.of("kg", 0.8, 2, `the weight: ${UNREAD}`, true),
  };
}
