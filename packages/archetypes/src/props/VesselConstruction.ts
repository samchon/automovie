import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";
import { createVessel } from "./createVessel";

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createVessel.Affordance> = ArchetypeBuilder<
  Id,
  createVessel.Dimension
>;

/** Create a model-space point in metres. */
const v: typeof Vector3.create = Vector3.create;

/** Resolve recorded sizing, then lay out the shared open floor, walls and surfaces. */
function draw<Id extends createVessel.Affordance>(
  kind: createVessel.Kind,
  params: Omit<createVessel.IParams, "kind">,
  seed?: number | string,
): {
  builder: Builder<Id | "inside" | "rim">;
  d: Record<createVessel.Dimension, number>;
} {
  const session: ArchetypeDrawSession<createVessel.Dimension> =
    new ArchetypeDrawSession<createVessel.Dimension>(
      "vessel",
      createVessel.UNITS,
      seed,
      params,
    );
  const drawn: Partial<Record<createVessel.Dimension, number>> =
    session.dimensions(createVessel.BANDS[kind]);
  // A bowl or an ashtray is one of the read models whole.
  const model: {
    name: createVessel.Model | undefined;
    figures: createVessel.Figures;
  } = session.model<createVessel.Model>(
    "model",
    params.model,
    createVessel.MODELS[kind],
  );
  const read: Partial<Record<createVessel.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const d: Record<createVessel.Dimension, number> = {
    diameter: read.diameter!,
    height: read.height!,
    mass: read.mass!,
  };
  const builder: Builder<Id | "inside" | "rim"> = new ArchetypeBuilder({
    material:
      kind === "bowl"
        ? "ceramic"
        : kind === "ashtray" || kind === "vase"
          ? "glass"
          : "steel",
    id: params.id,
    name: kind,
    draw: session,
  });
  const wall: number = createVessel.WALL;
  const r: number = d.diameter / 2;
  const color: string = createVessel.COLORS[kind];
  builder.rod("floor", r, v(0, 0, 0), v(0, wall, 0), { color });
  for (const [id, size, at] of [
    [
      "wallFront",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, r - wall / 2),
    ],
    [
      "wallBack",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, -r + wall / 2),
    ],
    [
      "wallLeft",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(r - wall / 2, (d.height + wall) / 2, 0),
    ],
    [
      "wallRight",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(-r + wall / 2, (d.height + wall) / 2, 0),
    ],
  ] as const)
    builder.box(id, size, at, { color });
  builder.affordance({
    id: "rim",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.diameter,
    depth: d.diameter,
  });
  builder.affordance({
    id: "inside",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.diameter - 2 * wall,
    depth: d.diameter - 2 * wall,
  });
  return { builder, d };
}

/** Define a grip from below the bottom floor of a shallow vessel. */
function dishGrip(
  builder: {
    affordance(contact: Parameters<Builder<"body">["affordance"]>[0]): void;
  },
  grip: "two-hand" | "precision",
): void {
  const wall: number = createVessel.WALL;
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, wall / 2, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    grip,
    aperture: wall,
  });
}

/**
 * Shared floor and wall geometry with distinct food, ash and display grips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shared floor and wall geometry with distinct food, ash and display grips.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace VesselConstruction {
  /**
   * Build a bowl held from beneath with two hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a bowl held from beneath with two hands.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve a recorded bowl and add an upward floor and a bottom grip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wall stays coarse and the recorded dimensions describe the chosen model.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function bowl(
    params: Omit<createVessel.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"rim" | "inside" | "body", createVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<"rim" | "inside" | "body">> =
      draw<"rim" | "inside" | "body">("bowl", params, seed);
    dishGrip(builder, "two-hand");
    return builder.build(d.mass);
  }

  /**
   * Build an ashtray grasped from below.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build an ashtray grasped from below.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve a recorded tray and add an upward floor and a precision bottom grip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wall stays coarse and the recorded dimensions describe the chosen model.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function ashtray(
    params: Omit<createVessel.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"rim" | "inside" | "body", createVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<"rim" | "inside" | "body">> =
      draw<"rim" | "inside" | "body">("ashtray", params, seed);
    dishGrip(builder, "precision");
    return builder.build(d.mass);
  }

  /**
   * Build a vase at the model origin with a grip around the middle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a vase at the model origin with a grip around the middle.
   * @evidence contracts/development/implementation.md#principled-implementation Produce the open vessel, then put the power grip through its middle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same four coarse wall boxes retain the floor and rim coordinates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function vase(
    params: Omit<createVessel.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"rim" | "inside" | "body", createVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<"rim" | "inside" | "body">> =
      draw<"rim" | "inside" | "body">("vase", params, seed);
    builder.affordance({
      id: "body",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, d.height / 2, 0),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter,
    });
    return builder.build(d.mass);
  }

  /**
   * Build a cooking pot with its own grasp arrangement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a cooking pot with its own grasp arrangement.
   * @evidence contracts/development/implementation.md#principled-implementation A saucepan attaches one long handle and a stockpot carries two short side bars. Grips share their rods' local axes and diameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measured vessel bands and coarse wall or handle estimates are retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most seven solids and four contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function cookingPot(
    kind: "saucepan" | "stockpot",
    params: Omit<createVessel.IParams, "kind">,
    seed?: number | string,
  ): Archetype<
    "rim" | "inside" | "handle" | "leftHandle" | "rightHandle",
    createVessel.Dimension
  > {
    const {
      builder,
      d,
    }: ReturnType<
      typeof draw<"rim" | "inside" | "handle" | "leftHandle" | "rightHandle">
    > = draw<"rim" | "inside" | "handle" | "leftHandle" | "rightHandle">(
      kind,
      params,
      seed,
    );
    const r: number = d.diameter / 2;
    const grip: number = createVessel.GRIP;
    if (kind === "saucepan") {
      const length: number = createVessel.HANDLE;
      builder.rod(
        "handle",
        grip / 2,
        v(r, d.height - grip, 0),
        v(r + length, d.height - grip, 0),
        {
          color: "#2c2f33",
        },
      );
      builder.affordance({
        id: "handle",
        kind: "handle",
        symmetry: "none",
        frame: ArchetypeFrame.facing(
          v(r + length / 2, d.height - grip, 0),
          v(0, 1, 0),
          v(1, 0, 0),
        ),
        extent: null,
        grip: "power",
        aperture: grip,
        length,
      });
    } else {
      for (const [id, sign] of [
        ["leftHandle", 1],
        ["rightHandle", -1],
      ] as const) {
        const x: number = sign * (r + 0.03);
        builder.rod(
          id,
          grip / 2,
          v(x, d.height - grip, -0.05),
          v(x, d.height - grip, 0.05),
          {
            color: "#2c2f33",
          },
        );
        builder.affordance({
          id,
          kind: "handle",
          symmetry: "none",
          frame: ArchetypeFrame.facing(
            v(x, d.height - grip, 0),
            v(0, 1, 0),
            v(0, 0, 1),
          ),
          extent: null,
          grip: "hook",
          aperture: grip,
          length: 0.1,
        });
      }
    }
    return builder.build(d.mass);
  }
}
