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
  "a diving mask: its dimensions and mass are provisional estimates, no maker's page was read";

/**
 * A diving mask over the eyes and nose. Its origin is the lens' centre, `+Z` out of the face and `+Y` up. `wear` is the skirt's inside, `+Y` toward the face, which seats on the face over the eyes and nose; `nose` is the nose pocket a hand pinches to equalize.
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
export function createDiveMask(
  params: createDiveMask.IParams = {},
  seed?: number | string,
): Archetype<createDiveMask.Affordance, createDiveMask.Dimension> {
  const draw: ArchetypeDrawSession<createDiveMask.Dimension> =
    new ArchetypeDrawSession("diveMask", createDiveMask.UNITS, seed, params);
  const d: Record<createDiveMask.Dimension, number> = draw.dimensions(
    createDiveMask.BANDS,
  );
  const builder: ArchetypeBuilder<
    createDiveMask.Affordance,
    createDiveMask.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "a diving mask",
    material: "rubber",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box("lens", v(d.width, d.height, 0.03), v(0, 0, 0), {
    color: "#9fd3e8",
  });
  builder.box("strap", v(d.width + 0.04, 0.02, 0.01), v(0, 0, -0.06), {
    color: "#1f2a36",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0, -0.02), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "nose",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, -d.height / 2, 0.01)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Dimensions and the socket of {@link createDiveMask}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contacts, the dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in provisional bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wear socket and points a scene or law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createDiveMask {
  /** The skirt's seat on the face, and the nose pocket. */
  export type Affordance = "wear" | "nose";

  /** The lens' width and height, and the mask's mass. */
  export type Dimension = "width" | "height" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(0.14, 0.17, STAGED, true),
    height: ArchetypeBand.metres(0.07, 0.09, STAGED, true),
    mass: ArchetypeBand.of("kg", 0.15, 0.25, STAGED, true),
  };
}
