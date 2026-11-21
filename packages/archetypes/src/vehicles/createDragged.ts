import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";

/**
 * A load drawn along the ground by a horse's traces rather than rolled on wheels: a walking mouldboard plough, a harrow, a chained log or a sledge on runners.
 *
 * The load stands with its front toward `+Z` and its ground contact on `Y=0`: the plough's share and landside, the harrow's tines, the log's underside, the sledge's runners. Its `coupling` is the clevis, chain ring or bar its whippletree is hooked to, at the front on the centreline. A plough carries two `leftHandle` and `rightHandle` grips behind it, `+X` the ploughman's left, and its `share`, the share's point at the furrow bottom, the frame a working depth is read at; a sledge carries a `bed` it is loaded on. The dimensions are construction estimates, `SIZES`, one set per kind; no maker's drawing was read, so each is provisional, and the author may fix any of them.
 *
 * @param params The kind, any dimension the author fixes, and the load's mass.
 * @returns The load at rest.
 * @throws {ArchetypeRefusal} For a nonpositive dimension or mass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands, its contacts and that its sizes are estimates.
 * @evidence contracts/development/implementation.md#principled-implementation Each kind is laid from bars and boxes on the ground plane with its contacts on the parts that bear them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the sizes, then one builder per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unread sizes are named estimates the author can override; a nonpositive one refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms A dozen parts at most.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDragged(
  params: createDragged.IParams,
): Archetype<createDragged.Affordance, createDragged.Dimension> {
  const d: Record<createDragged.Dimension, number> = {
    ...createDragged.SIZES[params.kind],
  };
  const draw: ArchetypeDrawSession<createDragged.Dimension> =
    new ArchetypeDrawSession<createDragged.Dimension>(
      "dragged",
      createDragged.UNITS,
      undefined,
    );
  for (const key of Object.keys(
    createDragged.UNITS,
  ) as createDragged.Dimension[]) {
    const value: number = params[key] ?? d[key];
    d[key] = value;
    if (!(Number.isFinite(value) && value > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "dragged",
        axis: key,
        value,
        feasible: null,
        reason: "must be finite and positive",
        fix: "give the load positive sizes and mass",
      });
    draw.derive(key, value);
  }
  const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const builder: ArchetypeBuilder<
    createDragged.Affordance,
    createDragged.Dimension
  > = new ArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: params.kind,
    draw,
  });
  const front: number = d.length / 2;
  let hitch: number = d.height;
  if (params.kind === "plough") {
    // The beam from the clevis down and back to the frog over the share; the handles rising back from it.
    hitch = d.height;
    builder.rod("beam", 0.04, v(0, hitch, front), v(0, 0.3, -front / 4));
    builder.box("share", v(d.width, 0.05, 0.35), v(0, 0.025, 0));
    builder.box("mouldboard", v(0.03, 0.25, 0.4), v(-d.width / 2, 0.15, -0.05));
    for (const [side, sign] of SIDES) {
      builder.rod(
        `handle-${side}`,
        0.02,
        v((sign * 0.05) / 2, 0.3, -front / 4),
        v((sign * d.handleSpread) / 2, d.handleHeight, -front),
      );
      builder.affordance({
        id: side === "left" ? "leftHandle" : "rightHandle",
        kind: "bar",
        symmetry: "round",
        frame: ArchetypeFrame.upright(
          v((sign * d.handleSpread) / 2, d.handleHeight, -front),
        ),
        extent: null,
        grip: "power",
        aperture: 0.04,
        length: 0.12,
      });
    }
    builder.affordance({
      id: "share",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
      width: d.width,
      depth: 0.35,
    });
  } else if (params.kind === "harrow") {
    hitch = d.height;
    builder.box("frame", v(d.width, 0.06, d.length), v(0, d.height, 0));
    for (let i: number = 0; i < 5; i++)
      for (let j: number = 0; j < 4; j++)
        builder.rod(
          `tine-${i}-${j}`,
          0.012,
          v(
            -d.width / 2 + (d.width * (i + 0.5)) / 5,
            d.height,
            -front + (d.length * (j + 0.5)) / 4,
          ),
          v(
            -d.width / 2 + (d.width * (i + 0.5)) / 5,
            0,
            -front + (d.length * (j + 0.5)) / 4,
          ),
        );
  } else if (params.kind === "log") {
    hitch = d.width / 2;
    builder.rod(
      "log",
      d.width / 2,
      v(0, d.width / 2, -front),
      v(0, d.width / 2, front),
    );
  } else {
    hitch = d.height;
    for (const [side, sign] of SIDES)
      builder.box(
        `runner-${side}`,
        v(0.06, 0.08, d.length),
        v((sign * (d.width - 0.06)) / 2, 0.04, 0),
      );
    builder.box(
      "bed",
      v(d.width, 0.05, d.length * 0.9),
      v(0, d.height - 0.025, 0),
    );
    builder.affordance({
      id: "bed",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, d.height, 0)),
      extent: null,
      width: d.width,
      depth: d.length * 0.9,
    });
  }
  builder.affordance({
    id: "coupling",
    kind: "hook",
    frame: ArchetypeFrame.upright(v(0, hitch, front)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Types and construction sizes of {@link createDragged}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, contact, dimension and size states what it is and that sizes are estimates.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds, contacts and dimensions, and metre and kilogram sizes per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a dragged ride and a ploughman read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No size claims a source.
 */
export namespace createDragged {
  /** The kinds of ground-drawn load. */
  export type Kind = "plough" | "harrow" | "log" | "sledge";

  /** The contacts: `coupling` at the front, a plough's `leftHandle`, `rightHandle` and `share`, a sledge's `bed`. */
  export type Affordance =
    | "coupling"
    | "leftHandle"
    | "rightHandle"
    | "share"
    | "bed";

  /** The dimensions, metres unless stated: `length` along the load, `width` across it (a log's diameter, a plough's share width), `height` of the coupling or the frame, a plough's `handleHeight` and `handleSpread`, and `mass` in kilograms. */
  export type Dimension =
    | "length"
    | "width"
    | "height"
    | "handleHeight"
    | "handleSpread"
    | "mass";

  /** The parameters: the kind and any dimension fixed. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which load. */
    kind: Kind;
    /** The model's id, unique in a scene. */
    id?: string;
  }

  /** Each dimension's unit. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    height: "m",
    handleHeight: "m",
    handleSpread: "m",
    mass: "kg",
  };

  /** Construction estimates per kind, none read from a maker: a walking plough about 2.4 m over its handles with a 0.25 m share and 0.9 m high grips 0.6 m apart; a 1.2 by 1.5 m harrow; a 4 m log 0.4 m through; a 2 m by 0.9 m sledge. */
  export const SIZES: Readonly<
    Record<Kind, Readonly<Record<Dimension, number>>>
  > = {
    plough: {
      length: 2.4,
      width: 0.25,
      height: 0.45,
      handleHeight: 0.9,
      handleSpread: 0.6,
      mass: 60,
    },
    harrow: {
      length: 1.5,
      width: 1.2,
      height: 0.15,
      handleHeight: 1,
      handleSpread: 1,
      mass: 50,
    },
    log: {
      length: 4,
      width: 0.4,
      height: 0.2,
      handleHeight: 1,
      handleSpread: 1,
      mass: 300,
    },
    sledge: {
      length: 2,
      width: 0.9,
      height: 0.35,
      handleHeight: 1,
      handleSpread: 1,
      mass: 80,
    },
  };
}

/** A side of the load. */
type Side = "left" | "right";

/** A side and the sign of `X` on it. */
type SideSign = readonly [Side, number];

/** The two sides, `+X` first. */
const SIDES: readonly SideSign[] = [
  ["left", 1],
  ["right", -1],
];
