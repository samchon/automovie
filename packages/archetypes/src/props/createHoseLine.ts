import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/**
 * A charged 1 3/4 in (44 mm) attack line with a fog nozzle, the hand line
 * a two-member team advances. The hose's bore is its trade size; its
 * outer diameter, the nozzle's proportions, the members' spacing, the
 * bail's swing and the charged segment's mass are provisional estimates.
 */
const SIZE: Readonly<createHoseLine.ISize> = {
  bore: 0.0445,
  outer: 0.055,
  length: 3,
  nozzle: 0.25,
  spacing: 1,
  bail: 90,
  flex: 45,
  mass: 9,
};

/**
 * A straight run of charged hose ending in a nozzle.
 *
 * The line runs along `+Z` from its tail at the origin to the nozzle's tip
 * at its length, at the hose's own height. `nozzle` is the nozzle
 * operator's grip on the nozzle's body; `bail` is the shut-off bail on the
 * nozzle, a hinge swung back toward the operator to open the flow, and
 * `bailTip` its handle, riding it; `backup` is the backup member's grip,
 * `spacing` behind the nozzle, riding `flex`, the line's bend at the
 * operator's hold, which turns the run behind it about the vertical to
 * either side; `tip` is the outlet, its `+Y` the stream's
 * direction along `+Z`.
 *
 * @param params The optional scene id.
 * @returns The hose line and its contacts, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the trade size, the frame and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation A hose run on a bend at the operator's hold, a lead and a nozzle, a bail on a hinge, and one grip per team member along the line.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the size, lay the hose, nozzle and bail, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hose is two rigid straight runs either side of one bend at the operator's hold; its sag and other kinks are not modelled. Every figure but the bore is a named estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four parts and six contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createHoseLine(
  params: createHoseLine.IParams = {},
): Archetype<createHoseLine.Affordance, createHoseLine.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const tip: number = SIZE.length;
  const start: number = tip - SIZE.nozzle;
  const draw: ArchetypeDrawSession<createHoseLine.Dimension> =
    new ArchetypeDrawSession(
      "hoseLine",
      { bore: "m", length: "m", mass: "kg" },
      undefined,
    );
  draw.derive("bore", SIZE.bore);
  draw.derive("length", SIZE.length);
  draw.derive("mass", SIZE.mass);
  const builder: ArchetypeBuilder<
    createHoseLine.Affordance,
    createHoseLine.Dimension
  > = new ArchetypeBuilder({
    id: params.id ?? "hose",
    name: "hose line",
    material: "rubber",
    draw,
  });
  // The line bends where the operator holds it: the run behind the nozzle
  // turns on the `flex` joint there, so the nozzle sweeps while the run
  // behind, and the backup's grip on it, stays where the backup holds it.
  const bend: number = tip - 0.15;
  builder.rod("hose", SIZE.outer / 2, v(0, 0, 0), v(0, 0, bend), {
    color: "#d8c9a3",
  });
  builder.rod("lead", SIZE.outer / 2, v(0, 0, bend), v(0, 0, start), {
    color: "#d8c9a3",
  });
  builder.affordance({
    id: "flex",
    kind: "wheel",
    extent: null,
    travel: SIZE.flex,
    parts: ["hose"],
    frame: ArchetypeFrame.upright(v(0, 0, bend)),
  });
  builder.rod("nozzle", 0.035, v(0, 0, start), v(0, 0, tip), {
    color: "#3d3d3d",
  });
  builder.box("bailBar", v(0.09, 0.01, 0.01), v(0, 0.06, tip - 0.08), {
    color: "#b8b8b8",
  });
  builder.affordance({
    id: "nozzle",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, 0, tip - 0.15), v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    grip: "power",
    aperture: 0.07,
    length: 0.1,
  });
  builder.affordance({
    id: "bail",
    kind: "hinge",
    extent: null,
    travel: SIZE.bail,
    parts: ["bailBar"],
    frame: ArchetypeFrame.facing(
      v(0, 0.035, tip - 0.08),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
  });
  builder.affordance({
    id: "bailTip",
    kind: "handle",
    symmetry: "none",
    rides: "bail",
    frame: ArchetypeFrame.facing(
      v(0, 0.06, tip - 0.08),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "hook",
    aperture: 0.01,
    length: 0.09,
  });
  builder.affordance({
    id: "backup",
    kind: "handle",
    symmetry: "round",
    rides: "flex",
    frame: ArchetypeFrame.facing(
      v(0, 0, tip - SIZE.nozzle - SIZE.spacing),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: SIZE.outer,
    length: 0.3,
  });
  builder.affordance({
    id: "tip",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0, tip), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/**
 * The inputs, contacts and size of {@link createHoseLine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the size.
 * @evidence contracts/development/design.md#principled-representation Metres, degrees and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two members' grips, the bail and the outlet the hose drill reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The size is fixed; no dimension is authorable.
 */
export namespace createHoseLine {
  /** The nozzle grip, the bail and its handle, the backup grip and the outlet. */
  export type Affordance =
    | "nozzle"
    | "bail"
    | "bailTip"
    | "backup"
    | "tip"
    | "flex";

  /** The bore, the length and the mass. */
  export type Dimension = "bore" | "length" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `hose` when absent. */
    id?: string;
  }

  /** The line's size. */
  export interface ISize {
    /** The hose's trade bore, metres. */
    bore: number;

    /** The hose's outer diameter, metres. */
    outer: number;

    /** The modelled run, tail to tip, metres. */
    length: number;

    /** The nozzle's length, metres. */
    nozzle: number;

    /** The backup's grip behind the nozzle, metres. */
    spacing: number;

    /** The line's bend at the operator's hold to either side, degrees. */
    flex: number;

    /** The bail's swing, degrees. */
    bail: number;

    /** The charged run's mass, kilograms. */
    mass: number;
  }
}
