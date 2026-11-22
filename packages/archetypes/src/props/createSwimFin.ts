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
  "a full-foot swimming fin: blade length and width and the mass are provisional estimates, no maker's page was read";

/**
 * One full-foot swimming fin. Its origin is the foot pocket's heel, `+Z`
 * along the blade and `+Y` up from the sole. `wear` is the pocket the foot
 * goes into, `+Y` toward the foot, at the ankle's place over the heel; the
 * blade's area is `length` times `width`, which a fin-swimming law reads as
 * the fin's hydrodynamic area.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The fin with its wear socket.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the socket and the blade area the motion reads.
 * @evidence contracts/development/implementation.md#principled-implementation A foot pocket box and a thin blade box ahead of it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, build two parts and one socket.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The blade is rigid; its flex is not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts and one contact.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSwimFin(
  params: createSwimFin.IParams = {},
  seed?: number | string,
): Archetype<createSwimFin.Affordance, createSwimFin.Dimension> {
  const draw: ArchetypeDrawSession<createSwimFin.Dimension> =
    new ArchetypeDrawSession("swimFin", createSwimFin.UNITS, seed, params);
  const d: Record<createSwimFin.Dimension, number> = draw.dimensions(
    createSwimFin.BANDS,
  );
  const builder: ArchetypeBuilder<
    createSwimFin.Affordance,
    createSwimFin.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "swim fin",
    material: "rubber",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box("pocket", v(0.11, 0.08, 0.28), v(0, 0.04, 0.12), {
    color: "#1f2a36",
  });
  builder.box(
    "blade",
    v(d.width, 0.006, d.length),
    v(0, 0.01, 0.26 + d.length / 2),
    {
      color: "#2b7fd0",
    },
  );
  builder.affordance({
    id: "blade",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, 0.013, 0.26 + d.length / 2)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0.07, 0.04), v(0, 1, 0), v(0, 0, 1)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Dimensions and the socket of {@link createSwimFin}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the socket, the blade dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in provisional bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wear socket and the blade a fin-swimming law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createSwimFin {
  /** The foot pocket, and the blade's upper face. */
  export type Affordance = "wear" | "blade";

  /** Blade length and width, and the fin's mass. */
  export type Dimension = "length" | "width" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.3, 0.45, STAGED, true),
    width: ArchetypeBand.metres(0.18, 0.22, STAGED, true),
    mass: ArchetypeBand.of("kg", 0.6, 1, STAGED, true),
  };
}
