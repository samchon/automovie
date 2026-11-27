import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import { AutoMovieArchetypeTray } from "../AutoMovieArchetypeTray";

/*
 * Open hand carriers with shared floor and wall geometry and separate gripping
 * arrangements.
 */
export namespace TrayConstruction {
  /*
   * The contact ids servingTray builds or reads.
   */
  export type ServingTrayContact =
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "palm"
    | "rest";

  /*
   * Build a low serving tray with opposing end grips, a flat-hand hold under
   * its floor's centre for a waiter's carry and a socket there for a glass.
   */
  export function servingTray(
    params: Omit<AutoMovieArchetypeTray.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<ServingTrayContact, AutoMovieArchetypeTray.Dimension> {
    const { builder, d }: ReturnType<typeof draw<ServingTrayContact>> =
      draw<ServingTrayContact>("tray", params, seed);
    const wall: number = AutoMovieArchetypeTray.WALL;
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
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * (hx - wall / 2), up, 0),
          v(sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "hook",
        aperture: wall,
        length: d.depth / 2,
      });
    // A waiter's flat hand under the floor's centre, fingers spread
    // forward, and the floor's centre where a glass stands.
    builder.affordance({
      id: "palm",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, 0),
        v(0, -1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "hook",
      aperture: wall,
      length: d.depth / 2,
    });
    builder.affordance({
      id: "rest",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, wall, 0)),
      extent: null,
    });
    return builder.build(d.mass);
  }

  /*
   * The contact ids basket builds or reads.
   */
  export type BasketContact = "inside" | "handle";

  /*
   * Build a deep carry basket with an overhead grip.
   */
  export function basket(
    params: Omit<AutoMovieArchetypeTray.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<BasketContact, AutoMovieArchetypeTray.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BasketContact>> =
      draw<BasketContact>("basket", params, seed);
    const wall: number = AutoMovieArchetypeTray.WALL;
    const hz: number = d.depth / 2;
    const grip: number = AutoMovieArchetypeTray.GRIP;
    const bar: number = d.height + AutoMovieArchetypeTray.CLEARANCE;
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, bar, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: grip,
      length: d.depth - 2 * wall,
    });
    return builder.build(d.mass);
  }
}

/*
 * Model-space points and dimensions use metres.
 */
const v: typeof Vector3.create = Vector3.create;

/*
 * Resolve a recorded carrier and build its common floor and walls.
 */
function draw<Id extends AutoMovieArchetypeTray.Affordance>(
  kind: AutoMovieArchetypeTray.Kind,
  params: Omit<AutoMovieArchetypeTray.IParams, "kind">,
  seed?: number,
): IDrawResult<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTray.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTray.Dimension>(
      "tray",
      AutoMovieArchetypeTray.UNITS,
      seed,
      params,
    );
  const drawn: Partial<Record<AutoMovieArchetypeTray.Dimension, number>> =
    session.dimensions(AutoMovieArchetypeTray.BANDS[kind]);
  // A tray or a basket is one of IKEA's read models whole.
  const model: {
    name: AutoMovieArchetypeTray.Model | undefined;
    figures: AutoMovieArchetypeTray.Figures;
  } = session.model<AutoMovieArchetypeTray.Model>(
    "model",
    params.model,
    AutoMovieArchetypeTray.MODELS[kind],
  );
  const read: Partial<Record<AutoMovieArchetypeTray.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const d: Record<AutoMovieArchetypeTray.Dimension, number> = {
    width: read.width!,
    depth: read.depth!,
    height: read.height!,
    mass: read.mass!,
  };
  const builder: Builder<Id | "inside"> = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw: session,
  });
  const wall: number = AutoMovieArchetypeTray.WALL;
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
    frame: AutoMovieArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.width - 2 * wall,
    depth: d.depth - 2 * wall,
  });
  return { builder, d };
}

/*
 * The model-space construction for the selected contact IDs.
 */
type Builder<Id extends AutoMovieArchetypeTray.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  AutoMovieArchetypeTray.Dimension
>;

/*
 * What draw prepares for its caller.
 */
interface IDrawResult<Id extends AutoMovieArchetypeTray.Affordance> {
  /*
   * The prepared `builder` this call returns.
   */
  builder: Builder<Id | "inside">;

  /*
   * The prepared `d` this call returns.
   */
  d: Record<AutoMovieArchetypeTray.Dimension, number>;
}
