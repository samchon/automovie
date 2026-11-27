import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeRowingMachineData from "./internal/AutoMovieArchetypeRowingMachineData";

/** Constructs the rowing machine archetype from its recipe. */
export namespace AutoMovieArchetypeRowingMachine {
/**
 * A rowing machine (an ergometer): a monorail with a sliding seat, a flywheel
 * at the front, two foot stretchers and a handle on its chain.
 *
 * The rail runs along `Z` centred over the origin, its front (the flywheel's
 * end) toward `+Z`, so the rower sits facing `+Z`. `seat` is the seat at its
 * catch-most place near the feet, `+Z` the way the rower faces; `handle` the
 * bar the hands pull, along `X` in front of the stretchers at rest on its hook;
 * `leftFoot` and `rightFoot` the stretchers' plates, tilted back toward the
 * rower.
 *
 * @param params The legs and any dimension the author fixes.
 * @param seed The seed that draws the legs when they are not given and every
 *   dimension left free inside its band; absent, the standard legs and the
 *   middle of each band.
 * @returns The rowing machine.
 * @throws {AutoMovieArchetypeRefusal} For legs Concept2 does not list or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRowingMachine.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeRowingMachine.Affordance,
  AutoMovieArchetypeRowingMachine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRowingMachine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRowingMachine.Dimension>(
      "rowingMachine",
      AutoMovieArchetypeRowingMachine.UNITS,
      seed,
      params,
    );
  const legs: {
    name: AutoMovieArchetypeRowingMachine.Legs | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeRowingMachine.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeRowingMachine.Legs>(
    "legs",
    params.legs,
    AutoMovieArchetypeRowingMachine.LEGS,
  );
  const d: Record<AutoMovieArchetypeRowingMachine.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeRowingMachine.BANDS),
    seatHeight: legs.figures.seatHeight!,
    mass: legs.figures.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRowingMachine.Affordance,
    AutoMovieArchetypeRowingMachine.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `rowing machine on ${legs.name} legs`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const rail: number = AutoMovieArchetypeRowingMachine.RAIL;
  const seat: Readonly<{ width: number; depth: number; thick: number }> =
    AutoMovieArchetypeRowingMachine.SEAT;
  const front: number = d.length / 2;
  const top: number = d.seatHeight - seat.thick;
  // The rail at the seat's underside, on a foot at each end.
  builder.box("rail", v(rail, rail, d.length), v(0, top - rail / 2, 0), {
    color: "#2c2f33",
  });
  builder.box(
    "rearFoot",
    v(d.width, top - rail, 0.06),
    v(0, (top - rail) / 2, -front + 0.03),
    {
      color: "#2c2f33",
    },
  );
  builder.box(
    "frontFoot",
    v(d.width, top - rail, 0.06),
    v(0, (top - rail) / 2, front - 0.03),
    {
      color: "#2c2f33",
    },
  );
  // The seat at its place nearest the feet.
  const sit: number = front - AutoMovieArchetypeRowingMachine.REACH;
  builder.box(
    "seat",
    v(seat.width, seat.thick, seat.depth),
    v(0, top + seat.thick / 2, sit - seat.depth / 2),
    {
      color: "#1d1f22",
    },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.seatHeight, sit)),
    extent: null,
    depth: seat.depth,
    width: seat.width,
  });
  // The flywheel's housing over the front foot.
  builder.box("flywheel", v(0.5, 0.5, 0.3), v(0, top + 0.25, front - 0.15), {
    color: "#3a3d42",
  });
  // Each stretcher's plate tilted back toward the rower, its foot on the rail.
  const tilt: number = AutoMovieArchetypeRowingMachine.TILT;
  const plate: Readonly<{ width: number; height: number }> =
    AutoMovieArchetypeRowingMachine.PLATE;
  const stretch: number = front - 0.35;
  const normal: IAutoMovieVector3 = v(
    0,
    Math.sin(tilt * AutoMovieArchetypeUnits.DEGREE),
    -Math.cos(tilt * AutoMovieArchetypeUnits.DEGREE),
  );
  for (const [id, sign] of [
    ["leftFoot", 1],
    ["rightFoot", -1],
  ] as const) {
    const centre: IAutoMovieVector3 = v(
      (sign * plate.width) / 2 + sign * 0.02,
      top +
        (plate.height / 2) * Math.cos(tilt * AutoMovieArchetypeUnits.DEGREE),
      stretch +
        (plate.height / 2) * Math.sin(tilt * AutoMovieArchetypeUnits.DEGREE),
    );
    builder.box(`${id}Plate`, v(plate.width, plate.height, 0.02), centre, {
      color: "#55595f",
      rotation: Quaternion.fromAxisAngle(v(1, 0, 0), tilt),
    });
    builder.affordance({
      id,
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.facing(
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
  const grip: number = AutoMovieArchetypeRowingMachine.GRIP;
  const held: number = top + 0.35;
  builder.rod(
    "handle",
    grip / 2,
    v(-d.handleWidth / 2, held, front - 0.32),
    v(d.handleWidth / 2, held, front - 0.32),
    {
      color: "#1d1f22",
    },
  );
  builder.affordance({
    id: "handle",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, held, front - 0.32),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: grip,
    length: d.handleWidth,
  });
  return builder.build(d.mass);
}

  /** The rail's section, metres: an estimate. */
  export const RAIL: number = 0.08;

  /** The seat's width, depth and thickness, metres: estimates. */
  export const SEAT: Readonly<{ width: number; depth: number; thick: number }> =
    {
      width: 0.3,
      depth: 0.25,
      thick: 0.05,
    };

  /**
   * The seat's front from the rail's front end at the catch, metres: an
   * estimate.
   */
  export const REACH: number = 0.9;

  /** Each stretcher plate's width and height, metres: estimates. */
  export const PLATE: Readonly<{ width: number; height: number }> = {
    width: 0.12,
    height: 0.28,
  };

  /**
   * The stretchers' tilt back from upright toward the rower, degrees: an
   * estimate.
   */
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
  export type Dimension =
    | "seatHeight"
    | "length"
    | "width"
    | "handleWidth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    seatHeight: "m",
    length: "m",
    width: "m",
    handleWidth: "m",
    mass: "kg",
  };

  /** Concept2's legs. */
  export type Legs = "standard" | "tall";

  /**
   * Each legs' seat height and mass, metres and kilograms, the default first:
   * Concept2's "14 in (36 cm) from the floor on the standard legs and 20 in (51
   * cm) on the tall legs", "57 lb on the standard legs, 68 lb on the tall legs"
   * (at the address `CONCEPT2` gives).
   */
  export const LEGS: Readonly<
    Record<Legs, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    standard: {
      seatHeight: 14 * AutoMovieArchetypeUnits.INCH,
      mass: 57 * AutoMovieArchetypeUnits.POUND,
    },
    tall: {
      seatHeight: 20 * AutoMovieArchetypeUnits.INCH,
      mass: 68 * AutoMovieArchetypeUnits.POUND,
    },
  };

  /**
   * The parameters: the legs, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "seatHeight" | "mass">, number>
  > {
    /** Concept2's legs; drawn from the seed when absent. */
    legs?: Legs;

    /** The model's id, unique in a scene; `rowingMachine` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "seatHeight" | "mass">, IAutoMovieArchetypeBand>
  > = {
    length: AutoMovieArchetypeBand.metres(
      96 * AutoMovieArchetypeUnits.INCH,
      96 * AutoMovieArchetypeUnits.INCH,
      `${AutoMovieArchetypeRowingMachineData.CONCEPT2}: 96 in long`,
    ),
    width: AutoMovieArchetypeBand.metres(
      24 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      `${AutoMovieArchetypeRowingMachineData.CONCEPT2}: 2 ft wide`,
    ),
    handleWidth: AutoMovieArchetypeBand.metres(
      0.45,
      0.55,
      "Concept2's page read gives no handle width",
      true,
    ),
  };
}
