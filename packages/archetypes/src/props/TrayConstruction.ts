import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";
import { createTray } from "./createTray";

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createTray.Affordance> = ArchetypeBuilder<
  Id,
  createTray.Dimension
>;

/** Model-space points and dimensions use metres. */
const v: typeof Vector3.create = Vector3.create;

/** Resolve a recorded carrier and build its common floor and walls. */
function draw<Id extends createTray.Affordance>(
  kind: createTray.Kind,
  params: Omit<createTray.IParams, "kind">,
  seed?: number | string,
): {
  builder: Builder<Id | "inside">;
  d: Record<createTray.Dimension, number>;
} {
  const session: ArchetypeDrawSession<createTray.Dimension> =
    new ArchetypeDrawSession<createTray.Dimension>(
      "tray",
      createTray.UNITS,
      seed,
      params,
    );
  const drawn: Partial<Record<createTray.Dimension, number>> =
    session.dimensions(createTray.BANDS[kind]);
  // A tray or a basket is one of IKEA's read models whole.
  const model: {
    name: createTray.Model | undefined;
    figures: createTray.Figures;
  } = session.model<createTray.Model>(
    "model",
    params.model,
    createTray.MODELS[kind],
  );
  const read: Partial<Record<createTray.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const d: Record<createTray.Dimension, number> = {
    width: read.width!,
    depth: read.depth!,
    height: read.height!,
    mass: read.mass!,
  };
  const builder: Builder<Id | "inside"> = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw: session,
  });
  const wall: number = createTray.WALL;
  const color: string = kind === "tray" ? "#6b4a2f" : "#b08d57";
  const hx: number = d.width / 2;
  const hz: number = d.depth / 2;
  const up: number = (d.height + wall) / 2;
  const tall: number = d.height - wall;
  builder.box("floor", v(d.width, wall, d.depth), v(0, wall / 2, 0), { color });
  for (const [id, size, at] of [
    ["wallFront", v(d.width, tall, wall), v(0, up, hz - wall / 2)],
    ["wallBack", v(d.width, tall, wall), v(0, up, -hz + wall / 2)],
    ["wallLeft", v(wall, tall, d.depth - 2 * wall), v(hx - wall / 2, up, 0)],
    ["wallRight", v(wall, tall, d.depth - 2 * wall), v(-hx + wall / 2, up, 0)],
  ] as const)
    builder.box(id, size, at, { color });
  builder.affordance({
    id: "inside",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.width - 2 * wall,
    depth: d.depth - 2 * wall,
  });
  return { builder, d };
}

/**
 * Open hand carriers with shared floor and wall geometry and separate gripping arrangements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Open hand carriers with shared floor and wall geometry and separate gripping arrangements.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace TrayConstruction {
  /**
   * Build a low serving tray with opposing end grips.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a low serving tray with opposing end grips.
   * @evidence contracts/development/implementation.md#principled-implementation Use the side wall thickness and location to define each hook grip, and floor height for the interior placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Recorded models own the overall sizes. The decorative rim retains its documented wall estimate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five boxes and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function servingTray(
    params: Omit<createTray.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"inside" | "leftHandle" | "rightHandle", createTray.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof draw<"inside" | "leftHandle" | "rightHandle">> = draw<
      "inside" | "leftHandle" | "rightHandle"
    >("tray", params, seed);
    const wall: number = createTray.WALL;
    const hx: number = d.width / 2;
    const up: number = (d.height + wall) / 2;
    for (const [id, sign] of [
      ["leftHandle", 1],
      ["rightHandle", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame: ArchetypeFrame.facing(
          v(sign * (hx - wall / 2), up, 0),
          v(sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "hook",
        aperture: wall,
        length: d.depth / 2,
      });
    return builder.build(d.mass);
  }

  /**
   * Build a deep carry basket with an overhead grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a deep carry basket with an overhead grip.
   * @evidence contracts/development/implementation.md#principled-implementation The floor placement stays below the walls. The hanging hand closes around the straight bar along its long interior axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original two posts and straight bar represent the handle at the documented clearance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight solids and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function basket(
    params: Omit<createTray.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"inside" | "handle", createTray.Dimension> {
    const { builder, d }: ReturnType<typeof draw<"inside" | "handle">> = draw<
      "inside" | "handle"
    >("basket", params, seed);
    const wall: number = createTray.WALL;
    const hz: number = d.depth / 2;
    const grip: number = createTray.GRIP;
    const bar: number = d.height + createTray.CLEARANCE;
    for (const [id, sign] of [
      ["frontPost", 1],
      ["backPost", -1],
    ] as const)
      builder.rod(
        id,
        grip / 2,
        v(0, d.height, sign * (hz - wall / 2)),
        v(0, bar, sign * (hz - wall / 2)),
        { color: "#b08d57" },
      );
    builder.rod(
      "handle",
      grip / 2,
      v(0, bar, -hz + wall / 2),
      v(0, bar, hz - wall / 2),
      { color: "#b08d57" },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, bar, 0), v(0, 1, 0), v(0, 0, 1)),
      extent: null,
      grip: "power",
      aperture: grip,
      length: d.depth - 2 * wall,
    });
    return builder.build(d.mass);
  }
}
