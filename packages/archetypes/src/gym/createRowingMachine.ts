import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Concept2's published RowErg figures as recalled, not read here. */
const CONCEPT2: string = "Concept2 RowErg specifications, recalled and not read";

/**
 * A rowing machine (an ergometer): a monorail with a sliding seat, a flywheel at the front, two foot stretchers and a handle on its chain.
 *
 * The rail runs along `Z` centred over the origin, its front (the flywheel's end) toward `+Z`, so the rower sits facing `+Z`. `seat` is the seat at its catch-most place near the feet, `+Z` the way the rower faces; `handle` the bar the hands pull, along `X` in front of the stretchers at rest on its hook; `leftFoot` and `rightFoot` the stretchers' plates, tilted back toward the rower.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The rowing machine.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the machine stands, the way the rower faces and its four contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A rail box of the drawn length on two feet, a seat box on it at the drawn height, a flywheel box at the front, two stretcher plates turned back by a fixed tilt and a handle rod before them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the rail and its feet, the seat, the flywheel, the stretchers, the handle.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The seat does not slide and the chain is not drawn; the rail is level; the parts' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRowingMachine(
  params: createRowingMachine.IParams = {},
  seed?: number | string,
): Archetype<createRowingMachine.Affordance, createRowingMachine.Dimension> {
  const d: Record<createRowingMachine.Dimension, number> =
    ArchetypeDraw.dimensions(
      "rowingMachine",
      createRowingMachine.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createRowingMachine.Affordance,
    createRowingMachine.Dimension
  > = new ArchetypeBuilder({
    archetype: "rowingMachine",
    id: params.id,
    name: "rowing machine",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const rail: number = createRowingMachine.RAIL;
  const seat: Readonly<{ width: number; depth: number; thick: number }> =
    createRowingMachine.SEAT;
  const front: number = d.length / 2;
  const top: number = d.seatHeight - seat.thick;
  // The rail at the seat's underside, on a foot at each end.
  builder.box("rail", v(rail, rail, d.length), v(0, top - rail / 2, 0), {
    color: "#2c2f33",
  });
  builder.box("rearFoot", v(d.width, top - rail, 0.06), v(0, (top - rail) / 2, -front + 0.03), {
    color: "#2c2f33",
  });
  builder.box("frontFoot", v(d.width, top - rail, 0.06), v(0, (top - rail) / 2, front - 0.03), {
    color: "#2c2f33",
  });
  // The seat at its place nearest the feet.
  const sit: number = front - createRowingMachine.REACH;
  builder.box("seat", v(seat.width, seat.thick, seat.depth), v(0, top + seat.thick / 2, sit - seat.depth / 2), {
    color: "#1d1f22",
  });
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(v(0, d.seatHeight, sit)),
    extent: null,
    depth: seat.depth,
    width: seat.width,
  });
  // The flywheel's housing over the front foot.
  builder.box("flywheel", v(0.5, 0.5, 0.3), v(0, top + 0.25, front - 0.15), {
    color: "#3a3d42",
  });
  // Each stretcher's plate tilted back toward the rower, its foot on the rail.
  const tilt: number = createRowingMachine.TILT;
  const plate: Readonly<{ width: number; height: number }> =
    createRowingMachine.PLATE;
  const stretch: number = front - 0.35;
  const normal: IAutoMovieVector3 = v(
    0,
    Math.sin((tilt * Math.PI) / 180),
    -Math.cos((tilt * Math.PI) / 180),
  );
  for (const [id, sign] of [
    ["leftFoot", 1],
    ["rightFoot", -1],
  ] as const) {
    const centre: IAutoMovieVector3 = v(
      (sign * plate.width) / 2 + sign * 0.02,
      top + (plate.height / 2) * Math.cos((tilt * Math.PI) / 180),
      stretch + (plate.height / 2) * Math.sin((tilt * Math.PI) / 180),
    );
    builder.box(`${id}Plate`, v(plate.width, plate.height, 0.02), centre, {
      color: "#55595f",
      rotation: Quaternion.fromAxisAngle(v(1, 0, 0), tilt),
    });
    builder.affordance({
      id,
      kind: "pedal",
      frame: ArchetypeFrame.facing(
        Vector3.add(centre, Vector3.scale(normal, 0.01)),
        normal,
        v(1, 0, 0),
      ),
      extent: null,
      width: plate.width,
      depth: plate.height,
    });
  }
  // The handle on its hook before the flywheel.
  const grip: number = createRowingMachine.GRIP;
  const held: number = top + 0.35;
  builder.rod("handle", grip / 2, v(-d.handleWidth / 2, held, front - 0.32), v(d.handleWidth / 2, held, front - 0.32), {
    color: "#1d1f22",
  });
  builder.affordance({
    id: "handle",
    kind: "bar",
    frame: ArchetypeFrame.facing(v(0, held, front - 0.32), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: grip,
    length: d.handleWidth,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createRowingMachine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension, the maker's figures where recalled; the seat's height is the one a seated workout reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seat, the handle and the two stretchers a rower uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The maker's figures were recalled and not read, so every band is provisional; the parts' sizes are named estimates.
 */
export namespace createRowingMachine {
  /** The rail's section, metres: an estimate. */
  export const RAIL: number = 0.08;

  /** The seat's width, depth and thickness, metres: estimates. */
  export const SEAT: Readonly<{ width: number; depth: number; thick: number }> = {
    width: 0.3,
    depth: 0.25,
    thick: 0.05,
  };

  /** The seat's front from the rail's front end at the catch, metres: an estimate. */
  export const REACH: number = 0.9;

  /** Each stretcher plate's width and height, metres: estimates. */
  export const PLATE: Readonly<{ width: number; height: number }> = {
    width: 0.12,
    height: 0.28,
  };

  /** The stretchers' tilt back from upright toward the rower, degrees: an estimate. */
  export const TILT: number = 40;

  /** The handle's diameter, metres: an estimate. */
  export const GRIP: number = 0.032;

  /**
   * The affordance ids:
   *
   * - `seat`: the seat at the catch, `+Z` the way the rower faces.
   * - `handle`: the handle, a bar along `X` taken from the rower's side.
   * - `leftFoot`, `rightFoot`: the stretchers' plates, `+Y` out toward the soles.
   */
  export type Affordance = "seat" | "handle" | "leftFoot" | "rightFoot";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `seatHeight`: the seat's top above the floor.
   * - `length`: the rail's.
   * - `width`: the feet's.
   * - `handleWidth`: the handle's.
   * - `mass`: kilograms.
   */
  export type Dimension = "seatHeight" | "length" | "width" | "handleWidth" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `rowingMachine` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    seatHeight: ArchetypeBand.metres(
      0.36,
      0.51,
      `${CONCEPT2}: the seat 14 in high on the standard legs and 20 in on the tall legs`,
      true,
    ),
    length: ArchetypeBand.metres(2.3, 2.44, `${CONCEPT2}: 8 ft long`, true),
    width: ArchetypeBand.metres(0.55, 0.61, `${CONCEPT2}: 2 ft wide`, true),
    handleWidth: ArchetypeBand.metres(0.45, 0.55, "a maker's handle, not read at a source", true),
    mass: ArchetypeBand.of("kg", 26, 30, `${CONCEPT2}: 57 lb`, true),
  };
}
