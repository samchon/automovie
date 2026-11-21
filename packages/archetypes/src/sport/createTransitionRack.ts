import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** No rack maker's page was read. */
const STAGED: string =
  "a triathlon transition rack bay: bar height and bay length are provisional staging estimates, no maker's page was read";

/** Frame colour. */
const STEEL: string = "#9aa1a6";

/**
 * One bay of a triathlon transition rack: a horizontal bar on two A-frame
 * ends. Its origin is on the ground at the middle of the bay, the bar runs
 * along X and the bicycles stand along +Z and -Z of it. A bicycle racks by
 * its saddle nose on the bar's top (`bar`), the arrangement World Triathlon
 * allows where the race racks by the saddle. The bar's height is authored so
 * the saddle rests on it with both wheels on the ground.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The bay with its bar-top surface.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the racking arrangement and the authored height.
 * @evidence contracts/development/implementation.md#principled-implementation A rod bar between two A-frame ends, each end two rods from the ground to the bar.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the bar, the ends and the surface.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bar top is the drawn height; no bicycle geometry is read.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five rods and one affordance.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTransitionRack(
  params: createTransitionRack.IParams = {},
  seed?: number | string,
): Archetype<createTransitionRack.Affordance, createTransitionRack.Dimension> {
  const draw: ArchetypeDrawSession<createTransitionRack.Dimension> =
    new ArchetypeDrawSession(
      "transitionRack",
      createTransitionRack.UNITS,
      seed,
      params,
    );
  const d: Record<createTransitionRack.Dimension, number> = draw.dimensions(
    createTransitionRack.BANDS,
  );
  const builder: ArchetypeBuilder<
    createTransitionRack.Affordance,
    createTransitionRack.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "transition rack",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = createTransitionRack.BAR / 2;
  const axis: number = d.height - radius;
  builder.rod(
    "bar",
    radius,
    v(-d.length / 2, axis, 0),
    v(d.length / 2, axis, 0),
    { color: STEEL },
  );
  for (const [end, x] of [
    ["left", -d.length / 2],
    ["right", d.length / 2],
  ] as const)
    for (const [leg, z] of [
      ["front", 0.4],
      ["back", -0.4],
    ] as const)
      builder.rod(`${end}-${leg}`, radius, v(x, 0, z), v(x, axis, 0), {
        color: STEEL,
      });
  builder.affordance({
    id: "bar",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.length,
    depth: createTransitionRack.BAR,
  });
  return builder.build(d.mass);
}

/**
 * Dimensions and the bar contact of {@link createTransitionRack}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bar contact, the dimensions and their staged provenance.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms in bands; one surface on the bar top.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar top a racked saddle rests on, read by a staged triathlon take.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is marked provisional.
 */
export namespace createTransitionRack {
  /** The bar's top, where a saddle nose rests. */
  export type Affordance = "bar";

  /** The bay's length, the bar top's height and the frame's mass. */
  export type Dimension = "length" | "height" | "mass";

  /** The bar's diameter, metres: an estimate. */
  export const BAR: number = 0.05;

  /** Scene identity and dimensions fixed within their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(1.5, 3, STAGED, true),
    height: ArchetypeBand.metres(0.8, 1.3, STAGED, true),
    mass: ArchetypeBand.of("kg", 15, 30, STAGED, true),
  };
}
