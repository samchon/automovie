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
  "a garden rake: its dimensions and mass are provisional estimates, no maker's page was read";

/**
 * A garden rake or a hoe: a crosswise head on a long handle, pulled along
 * the ground in two hands. Its head lies at the origin with the handle up
 * `+Y` and the tines (a hoe's blade) toward `+Z`; `face` is the line of the
 * tine tips facing `+Z`, and `shaft` the handle the two hands hold.
 *
 * @param params Scene identity, the kind and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The tool with its contacts.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the two kinds and the contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Coarse boxes and a rod sized by the drawn dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, then build the head, the tines, the handle and the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rigid coarse parts; the tines are one box.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts and two contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRake(
  params: createRake.IParams = {},
  seed?: number | string,
): Archetype<createRake.Affordance, createRake.Dimension> {
  const draw: ArchetypeDrawSession<createRake.Dimension> =
    new ArchetypeDrawSession("rake", createRake.UNITS, seed, params);
  const d: Record<createRake.Dimension, number> = draw.dimensions(
    createRake.BANDS,
  );
  const hoe: boolean = params.kind === "hoe";
  const builder: ArchetypeBuilder<createRake.Affordance, createRake.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: hoe ? "a hoe" : "a garden rake",
      material: "steel",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const tines: number = 0.08;
  builder.box("head", v(d.width, 0.03, 0.03), v(0, 0.015, 0), {
    color: "#5c6066",
    share: 0.35,
  });
  builder.box(
    "tines",
    v(d.width, hoe ? 0.1 : 0.01, tines),
    v(0, hoe ? -0.02 : 0.005, tines / 2 + 0.015),
    { color: "#5c6066", share: 0.15 },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(0, 0.005, tines + 0.015),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    width: d.width,
  });
  builder.rod("handle", 0.014, v(0, 0.03, 0), v(0, d.length, 0), {
    color: "#b98d5b",
    share: 0.5,
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, (0.03 + d.length) / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 0.028,
    length: d.length - 0.03,
  });
  return builder.build(d.mass);
}

/**
 * Kinds, dimensions and contacts of {@link createRake}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the kinds, the contacts, the dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in provisional bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face and the shaft a law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createRake {
  /** A tined rake, or a bladed hoe. */
  export type Kind = "rake" | "hoe";

  /** The tine tips, and the handle held in two hands. */
  export type Affordance = "face" | "shaft";

  /** The overall length, the head's width and the mass. */
  export type Dimension = "length" | "width" | "mass";

  /** Scene identity, the kind and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;

    /** The kind; a rake when absent. */
    kind?: Kind;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(1.4, 1.65, STAGED, true),
    width: ArchetypeBand.metres(0.3, 0.42, STAGED, true),
    mass: ArchetypeBand.of("kg", 0.9, 1.6, STAGED, true),
  };
}
