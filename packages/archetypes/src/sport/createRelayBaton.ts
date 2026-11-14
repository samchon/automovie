import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** World Athletics' baton rule as recalled, not read here. */
const RULE: string = "World Athletics Technical Rules, the relay baton";

/**
 * A relay baton: a smooth hollow tube of round section.
 *
 * It stands on its back end at the origin along `+Y`. `grip` is the tube a hand closes on, along its whole length; `front` and `back` are its two ends, each `+Y` out of the tube: the incoming runner pushes one end into the outgoing runner's palm (`relayPass`'s `end`).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The baton.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the baton stands, its three contacts and what reads them.
 * @evidence contracts/development/implementation.md#principled-implementation One rod of the drawn length and diameter; its mass the drawn mass, a hollow tube's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, three contacts.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The rule's baton is a plain tube, which this is; its hollowness is its mass.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRelayBaton(
  params: createRelayBaton.IParams = {},
  seed?: number | string,
): Archetype<createRelayBaton.Affordance, createRelayBaton.Dimension> {
  const d: Record<createRelayBaton.Dimension, number> =
    ArchetypeDraw.dimensions(
      "relayBaton",
      createRelayBaton.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createRelayBaton.Affordance,
    createRelayBaton.Dimension
  > = new ArchetypeBuilder({
    archetype: "relayBaton",
    id: params.id,
    name: "relay baton",
    dimensions: d,
  });
  builder.rod(
    "tube",
    d.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.length, 0),
    { color: "#d4a017" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, d.length / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter,
    length: d.length,
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, d.length, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "back",
    kind: "surface",
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
 * Companion types and bands of {@link createRelayBaton}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One band per dimension, the rule's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tube a hand takes and the two ends a pass pushes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rule was recalled and not read here, so every band is provisional.
 */
export namespace createRelayBaton {
  /**
   * The affordance ids:
   *
   * - `grip`: the tube, taken from `-Z` along its whole length.
   * - `front`: the top end, `+Y` out of it.
   * - `back`: the bottom end at the origin, `+Y` down out of it.
   */
  export type Affordance = "grip" | "front" | "back";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: end to end.
   * - `diameter`: across the tube.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `relayBaton` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.28, 0.3, `${RULE}: 28 to 30 cm long`, true),
    diameter: ArchetypeBand.metres(
      0.038,
      0.042,
      `${RULE}: 40 mm across, to 2 mm`,
      true,
    ),
    mass: ArchetypeBand.of(
      "kg",
      0.05,
      0.07,
      `${RULE}: at least 50 g; the upper end is a maker's aluminium baton`,
      true,
    ),
  };
}
