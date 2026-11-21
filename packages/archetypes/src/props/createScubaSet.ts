import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** No maker's page was read. */
const STAGED: string =
  "a scuba set: its dimensions and mass are provisional estimates, no maker's page was read";

/**
 * A scuba cylinder on a buoyancy jacket, with its first-stage regulator. Its origin is the jacket's back plate centre, `+Z` out of the diver's back and `+Y` toward the head. `wear` is the jacket's inside, `+Y` toward the diver's back; `regulator` is the second stage the mouth takes.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The item with its contacts.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Coarse boxes, rods and balls sized by the drawn dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, then build the parts and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rigid coarse parts; straps and hoses are not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms A few parts and contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createScubaSet(
  params: createScubaSet.IParams = {},
  seed?: number | string,
): Archetype<createScubaSet.Affordance, createScubaSet.Dimension> {
  const draw: ArchetypeDrawSession<createScubaSet.Dimension> =
    new ArchetypeDrawSession("scubaSet", createScubaSet.UNITS, seed, params);
  const d: Record<createScubaSet.Dimension, number> = draw.dimensions(
    createScubaSet.BANDS,
  );
  const builder: ArchetypeBuilder<
    createScubaSet.Affordance,
    createScubaSet.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "a scuba set",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod(
    "cylinder",
    d.diameter / 2,
    v(0, -d.length / 2, 0.02 + d.diameter / 2),
    v(0, d.length / 2, 0.02 + d.diameter / 2),
    { color: "#c8cdd1" },
  );
  builder.box("jacket", v(0.36, 0.5, 0.06), v(0, 0, -0.03), {
    color: "#1f2a36",
  });
  builder.ball(
    "first-stage",
    0.035,
    v(0, d.length / 2 + 0.03, 0.02 + d.diameter / 2),
    {
      color: "#6b7177",
    },
  );
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0, -0.06), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
  });
  builder.affordance({
    id: "regulator",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0.1, d.length / 2 + 0.05, -0.15)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Dimensions and the socket of {@link createScubaSet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contacts, the dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in provisional bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wear socket and points a scene or law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createScubaSet {
  /** The jacket on the back, and the second stage at the mouth. */
  export type Affordance = "wear" | "regulator";

  /** The cylinder's length and diameter, and the set's mass. */
  export type Dimension = "length" | "diameter" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.6, 0.7, STAGED, true),
    diameter: ArchetypeBand.metres(0.17, 0.19, STAGED, true),
    mass: ArchetypeBand.of("kg", 15, 20, STAGED, true),
  };
}
