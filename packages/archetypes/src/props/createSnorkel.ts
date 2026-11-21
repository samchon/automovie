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
  "a snorkel: its dimensions and mass are provisional estimates, no maker's page was read";

/**
 * A J snorkel worn beside the head. Its origin is the mouthpiece, `+Y` up along the barrel and `+Z` out of the mouth. `wear` is the mouthpiece the mouth closes on; `top` is the barrel's open top, which must stay above the surface while the swimmer breathes through it.
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
export function createSnorkel(
  params: createSnorkel.IParams = {},
  seed?: number | string,
): Archetype<createSnorkel.Affordance, createSnorkel.Dimension> {
  const draw: ArchetypeDrawSession<createSnorkel.Dimension> =
    new ArchetypeDrawSession("snorkel", createSnorkel.UNITS, seed, params);
  const d: Record<createSnorkel.Dimension, number> = draw.dimensions(
    createSnorkel.BANDS,
  );
  const builder: ArchetypeBuilder<
    createSnorkel.Affordance,
    createSnorkel.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "a snorkel",
    material: "rubber",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod("barrel", 0.011, v(0.04, 0, -0.03), v(0.04, d.length, -0.03), {
    color: "#f2c230",
  });
  builder.rod("mouthpiece", 0.011, v(0, 0, 0), v(0.04, 0, -0.03), {
    color: "#1f2a36",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "top",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0.04, d.length, -0.03)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Dimensions and the socket of {@link createSnorkel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contacts, the dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in provisional bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wear socket and points a scene or law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createSnorkel {
  /** The mouthpiece, and the barrel's open top. */
  export type Affordance = "wear" | "top";

  /** The barrel's height above the mouthpiece, and the mass. */
  export type Dimension = "length" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.32, 0.4, STAGED, true),
    mass: ArchetypeBand.of("kg", 0.1, 0.2, STAGED, true),
  };
}
