import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
} from "../core";
import { CAR_BANDS } from "./CAR_BANDS";

/**
 * A passenger car: a sedan or a hatchback, with front doors that open, seats, a steering wheel, two pedals and a gear lever.
 *
 * The car stands on its wheels with the middle of its wheelbase over the origin, its front toward `+Z`. The body is an open frame (a floor, a bonnet, a boot, a roof on four pillars and low door panels) so the seats and the controls show through it. The driver sits on the side `drive` names; `left` is `+X`. Everything a driver's and a passenger's act reads is an affordance: the door hinges with their handles and the openings behind them, the seats, the steering wheel, the pedals and the gear lever, the driver's belt and the mirror. The front road wheels steer as the steering wheel turns, so a turn of the wheel shows on the road.
 *
 * `driveCar` moves it along a course.
 *
 * @param params The class, the driving side and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The car.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the car's origin and front, why the body is open, which side the driver is on and what the affordances cover.
 * @evidence contracts/development/implementation.md#principled-implementation Boxes and rods placed from the drawn length, width, height, wheelbase and seat height. The interior is laid out from the driver's seating reference point: `REFERENCE` behind the front axle, `seatHeight` above the cabin floor, with the wheel, the pedals and the lever at stated offsets from it. Each door's hinge axis points so a positive travel swings it outward.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the body, then the doors, the seats and the controls, each with its affordances.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offsets of the controls from the seating reference point are named constants marked as unsourced; the front road wheels steer, following the steering wheel through a table of their Ackermann angles at `STEER_STEP` spacing, but no road wheel spins yet (#3498).
 * @evidence contracts/development/implementation.md#efficient-algorithms About thirty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCar(
  params: createCar.IParams,
  seed?: number | string,
): Archetype<createCar.Affordance, createCar.Dimension> {
  const kind: createCar.Kind = ArchetypeDraw.choice(
    "car",
    "kind",
    params.kind,
    createCar.KINDS,
  );
  const side: number =
    ArchetypeDraw.choice("car", "drive", params.drive ?? "left", [
      "left",
      "right",
    ]) === "left"
      ? 1
      : -1;
  const d: Record<createCar.Dimension, number> = ArchetypeDraw.dimensions(
    "car",
    createCar.BANDS[kind],
    seed,
    params,
    createCar.BANDS,
  );
  const builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension> =
    new ArchetypeBuilder({
      archetype: "car",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = d.width / 2;
  const front: number = d.wheelbase / 2 + (d.length - d.wheelbase) * 0.45;
  const rear: number = front - d.length;
  const floor: number = createCar.FLOOR;
  const belt: number = floor + 0.55;
  const firewall: number =
    d.wheelbase / 2 - createCar.REFERENCE + createCar.HEEL + createCar.FOOTWELL;
  const back: number = -d.wheelbase / 2 + 0.1;
  const body: string = "#3f6c8f";

  // The body: floor, bonnet, boot, roof on its pillars, and the wheels, which stand out to the doors' outer faces so the body's sides do not hide them.
  builder.box(
    "floor",
    v(d.width, 0.12, d.length),
    v(0, floor - 0.06, (front + rear) / 2),
    { color: body },
  );
  builder.box(
    "bonnet",
    v(d.width, belt - floor, front - firewall),
    v(0, (belt + floor) / 2, (front + firewall) / 2),
    { color: body },
  );
  builder.box(
    "boot",
    v(d.width, (kind === "sedan" ? belt : d.height) - floor, back - rear),
    v(0, ((kind === "sedan" ? belt : d.height) + floor) / 2, (back + rear) / 2),
    { color: body },
  );
  builder.box(
    "roof",
    v(d.width, 0.04, firewall - 0.35 - back),
    v(0, d.height - 0.02, (firewall - 0.35 + back) / 2),
    { color: body },
  );
  for (const [name, x, z0, z1] of [
    ["pillar-front-left", half - 0.03, firewall, firewall - 0.35],
    ["pillar-front-right", -half + 0.03, firewall, firewall - 0.35],
    ["pillar-rear-left", half - 0.03, back, back],
    ["pillar-rear-right", -half + 0.03, back, back],
  ] as const)
    builder.rod(name, 0.03, v(x, belt, z0), v(x, d.height - 0.04, z1), {
      color: body,
    });
  for (const [name, x, z] of [
    ["wheel-front-left", 1, d.wheelbase / 2],
    ["wheel-front-right", -1, d.wheelbase / 2],
    ["wheel-rear-left", 1, -d.wheelbase / 2],
    ["wheel-rear-right", -1, -d.wheelbase / 2],
  ] as const)
    builder.rod(
      name,
      d.wheelDiameter / 2,
      v(x * (half - 0.18), d.wheelDiameter / 2, z),
      v(x * (half + 0.02), d.wheelDiameter / 2, z),
      { color: "#22262b" },
    );

  // The driver's seating reference point, from which the cabin is laid out.
  const sz: number = d.wheelbase / 2 - createCar.REFERENCE;
  const sy: number = floor + d.seatHeight;
  const sx: number = half * 0.5;
  const surface: number = sy - createCar.HIP;

  // The front doors, the openings behind them and the front seats.
  const pillar: number = sz - 0.25;
  for (const [role, sign] of [
    ["driver", side],
    ["passenger", -side],
  ] as const) {
    const x: number = sign * half;
    builder.box(
      `door-${role}`,
      v(0.04, belt - floor, firewall - pillar),
      v(x, (belt + floor) / 2, (firewall + pillar) / 2),
      { color: "#355c7a" },
    );
    builder.rod(
      `door-handle-${role}`,
      0.01,
      v(x + sign * 0.03, belt - 0.08, pillar + 0.18),
      v(x + sign * 0.03, belt - 0.08, pillar + 0.06),
      { color: "#c9ccd1" },
    );
    builder.rod(
      `pillar-mid-${role}`,
      0.03,
      v(sign * (half - 0.03), belt, pillar),
      v(sign * (half - 0.03), d.height - 0.04, pillar),
      { color: body },
    );
    builder.affordance({
      id: `${role}Door`,
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        v(x, (belt + floor) / 2, firewall),
        v(0, -sign, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: d.doorSwing,
      parts: [`door-${role}`, `door-handle-${role}`],
    });
    builder.affordance({
      id: `${role}DoorHandle`,
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        v(x + sign * 0.03, belt - 0.08, pillar + 0.12),
        v(sign, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "hook",
      aperture: 0.02,
      length: 0.12,
      rides: `${role}Door`,
    });
    builder.affordance({
      id: `${role}Aperture`,
      kind: "aperture",
      frame: ArchetypeFrame.facing(
        v(x, floor, (firewall + pillar) / 2),
        v(0, 1, 0),
        v(0, 0, sign),
      ),
      extent: null,
      width: firewall - pillar,
      height: d.height - 0.04 - floor,
    });
    seat(builder, `${role}Seat`, role, v(sign * sx, surface, sz), 0.5);
  }
  seat(builder, "rearSeat", "rear", v(0, surface, sz - 0.8), d.width - 0.3);

  // The steering wheel: a rim on its column's axis, tilted back from upright, turning lock to lock, with one spoke across it so a turn shows.
  const tilt: number = (d.steeringAngle * Math.PI) / 180;
  const axis: IAutoMovieVector3 = v(0, Math.sin(tilt), -Math.cos(tilt));
  const hub: IAutoMovieVector3 = v(
    side * sx,
    sy + createCar.WHEEL.up,
    sz + createCar.WHEEL.ahead,
  );
  builder.rod(
    "steering-rim",
    d.steeringDiameter / 2,
    Vector3.subtract(hub, Vector3.scale(axis, 0.015)),
    Vector3.add(hub, Vector3.scale(axis, 0.015)),
    { color: "#22262b" },
  );
  builder.rod(
    "steering-column",
    0.02,
    Vector3.subtract(hub, Vector3.scale(axis, 0.3)),
    hub,
    { color: "#55595f" },
  );
  builder.rod(
    "steering-spoke",
    0.008,
    Vector3.add(
      hub,
      Vector3.add(Vector3.scale(axis, 0.02), v(-d.steeringDiameter / 2, 0, 0)),
    ),
    Vector3.add(
      hub,
      Vector3.add(Vector3.scale(axis, 0.02), v(d.steeringDiameter / 2, 0, 0)),
    ),
    { color: "#c9ccd1" },
  );
  builder.affordance({
    id: "wheel",
    kind: "wheel",
    frame: ArchetypeFrame.facing(hub, axis, v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: 0.03,
    radius: d.steeringDiameter / 2,
    travel: d.lockTurns * 180,
    parts: ["steering-rim", "steering-spoke"],
  });

  // The front road wheels steer about upright axes through their centres, each by its Ackermann angle at the steering wheel's turn.
  const lock: number = d.lockTurns * 180;
  const track: number = 2 * (half - 0.08);
  for (const [id, part, x] of [
    ["frontLeftWheel", "wheel-front-left", 1],
    ["frontRightWheel", "wheel-front-right", -1],
  ] as const) {
    const angle = (steering: number): number =>
      createCar.ackermann(
        steering / d.steeringRatio,
        d.wheelbase,
        (x * track) / 2,
      );
    // Rows each side of straight, so straight ahead is a row and gives straight wheels exactly.
    const side: number = Math.ceil(
      lock / d.steeringRatio / createCar.STEER_STEP,
    );
    builder.affordance({
      id,
      kind: "wheel",
      frame: ArchetypeFrame.facing(
        v((x * track) / 2, d.wheelDiameter / 2, d.wheelbase / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: createCar.ackermann(
        lock / d.steeringRatio,
        d.wheelbase,
        track / 2,
      ),
      parts: [part],
      follows: {
        id: "wheel",
        table: Array.from(
          { length: 2 * side + 1 },
          (_: unknown, k: number): [number, number] => {
            const steering: number =
              k === 0 ? -lock : k === 2 * side ? lock : (lock * (k - side)) / side;
            return [steering, angle(steering)];
          },
        ),
      },
    });
  }

  // The pedals in the footwell behind the bulkhead, the accelerator under the right foot and the brake beside it.
  const heel: number = sz + createCar.HEEL;
  const sole: IAutoMovieVector3 = v(0, 0.5, -0.866);
  for (const [id, offset, width] of [
    ["accelerator", -0.1, 0.05],
    ["brake", 0.02, 0.1],
  ] as const) {
    const at: IAutoMovieVector3 = v(
      side * sx + offset,
      floor + 0.15,
      heel + 0.1,
    );
    builder.box(`pedal-${id}`, v(width, 0.01, 0.08), at, {
      color: "#22262b",
      rotation: ArchetypeFrame.facing(at, sole, v(1, 0, 0)).rotation,
    });
    builder.affordance({
      id,
      kind: "pedal",
      frame: ArchetypeFrame.facing(
        Vector3.add(at, Vector3.scale(sole, 0.005)),
        sole,
        v(1, 0, 0),
      ),
      extent: null,
      width,
      depth: 0.08,
      travel: d.pedalTravel,
      parts: [`pedal-${id}`],
    });
  }

  // The gear lever between the seats, its knob slid fore and aft.
  const knob: IAutoMovieVector3 = v(0, surface + 0.15, sz + 0.25);
  builder.rod("gear-lever", 0.012, v(0, floor, sz + 0.25), knob, {
    color: "#55595f",
  });
  builder.ball("gear-knob", 0.025, knob, { color: "#22262b" });
  builder.affordance({
    id: "gear",
    kind: "slider",
    frame: ArchetypeFrame.facing(knob, v(0, 1, 0), v(0, 0, -1)),
    extent: null,
    travel: 0.08,
    parts: ["gear-lever", "gear-knob"],
  });
  builder.affordance({
    id: "gearKnob",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(knob, v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    grip: "power",
    aperture: 0.05,
    rides: "gear",
  });
  builder.affordance({
    id: "driverBelt",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(side * (half - 0.05), sy + 0.5, pillar),
      v(-side, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "precision",
  });
  builder.affordance({
    id: "mirror",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, d.height - 0.12, firewall - 0.4),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Add one seat: a cushion and a backrest, and its `seat` affordance on the cushion's front edge facing forward. */
function seat(
  builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
  id: "driverSeat" | "passengerSeat" | "rearSeat",
  name: string,
  reference: IAutoMovieVector3,
  width: number,
): void {
  // The cushion's surface passes under the reference point, which lies 0.1 m ahead of the backrest.
  const depth: number = 0.48;
  const rear: number = reference.z - 0.1;
  builder.box(
    `cushion-${name}`,
    Vector3.create(width, 0.12, depth),
    Vector3.create(reference.x, reference.y - 0.06, rear + depth / 2),
    { color: "#6f7f93", density: 0.2 },
  );
  builder.box(
    `backrest-${name}`,
    Vector3.create(width, 0.6, 0.1),
    Vector3.create(reference.x, reference.y + 0.3, rear - 0.05),
    { color: "#6f7f93", density: 0.2 },
  );
  builder.affordance({
    id,
    kind: "seat",
    frame: ArchetypeFrame.upright(
      Vector3.create(reference.x, reference.y, rear + depth),
    ),
    extent: null,
    depth,
    width,
    back: 0.6,
  });
}

/**
 * Companion types and bands of {@link createCar}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and layout constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions, one cited band per dimension per class, and the interior laid out from the seating reference point as SAE J1100 does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions an entering and a driving act read (#3372): seat height, the wheel's place, size and turn, the door's swing, the pedals' travel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Layout offsets no source gave are exported constants that say so, not numbers buried in the builder.
 */
export namespace createCar {
  /** The classes of car. */
  export type Kind = "sedan" | "hatchback";

  /** Every class, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["sedan", "hatchback"];

  /** The cabin floor (the heel's rest) above the ground, metres: a typical floor over the 128 to 146 mm ground clearance of the two Honda hatchbacks; not read at a source. */
  export const FLOOR: number = 0.3;

  /** The driver's seating reference point behind the front axle, metres: a typical package, not read at a source. */
  export const REFERENCE: number = 1.25;

  /** The seating reference point above the cushion's surface, metres: the 97.5 mm of the SAE J826 H-point machine, recalled and not read at a source. */
  export const HIP: number = 0.0975;

  /** The heel point ahead of the seating reference point, metres: SAE J1100's L53, which the standard defines without a value; a typical sedan's, not read at a source. */
  export const HEEL: number = 0.85;

  /** The bulkhead ahead of the heel point, metres: the pedal pads stand 0.1 m ahead of the heel and travel on from there; an estimate, not read at a source. */
  export const FOOTWELL: number = 0.16;

  /** The steering wheel's centre from the seating reference point, metres ahead and up: SAE J1100's L11 and H17 are measured from the heel point and given no value; a typical package, not read at a source. */
  export const WHEEL: Readonly<{ ahead: number; up: number }> = {
    ahead: 0.42,
    up: 0.33,
  };

  /** The spacing of the road wheels' steering table, degrees of the mean road wheel angle per row: linear interpolation between rows this close stays within a hundredth of a degree of the Ackermann angle, the curve's second derivative being under a radian per radian squared over a car's lock. */
  export const STEER_STEP: number = 1;

  /**
   * The angle a front road wheel steers to so that its axle line meets the rear axle's at the turn's centre: Ackermann steering geometry.
   *
   * @param centre The equivalent single wheel's angle at the middle of the front axle, degrees, positive to the left: the steering wheel's turn over the steering ratio, the angle `driveCar` turns the car's path by.
   * @param wheelbase The wheelbase, metres.
   * @param side The wheel's offset from the car's centre line, metres, positive to the left (`+X`): half the track.
   * @returns The wheel's steering angle, degrees, positive to the left; the inner wheel of a turn steers more than the outer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry, each input's unit and sign, and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rear axle's turning radius is the wheelbase over the tangent of the middle angle; a wheel offset `side` toward the centre turns on that radius less `side`, so its angle's tangent is the wheelbase over that, written as an arctangent of two terms so a straight wheel and a turn either way are one expression (Ackermann steering geometry, Wikipedia, https://en.wikipedia.org/wiki/Ackermann_steering_geometry, not read at a primary). King-pin inclination and caster are left out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ackermann(
    centre: number,
    wheelbase: number,
    side: number,
  ): number {
    const tangent: number = Math.tan((centre * Math.PI) / 180);
    return (
      (Math.atan2(wheelbase * tangent, wheelbase - side * tangent) * 180) /
      Math.PI
    );
  }

  /**
   * The affordance ids:
   *
   * - `driverDoor`, `passengerDoor`: the front doors' hinges at their front edges; a positive travel swings the door outward.
   * - `driverDoorHandle`, `passengerDoorHandle`: the outside handles, each riding its door.
   * - `driverAperture`, `passengerAperture`: the door openings, passed through into the car.
   * - `driverSeat`, `passengerSeat`, `rearSeat`: the seats, facing forward.
   * - `wheel`: the steering wheel, its axis toward the driver; its travel is half the lock-to-lock turn to either side, positive to the left.
   * - `frontLeftWheel`, `frontRightWheel`: the front road wheels' steering, each about the upright through its centre, positive to the left, following `wheel` by its Ackermann angle (`ackermann`), so the inner wheel of a turn steers more than the outer; a `wheel` articulation because a road wheel steers to either side of straight, which a `knob`'s range from 0 does not allow.
   * - `accelerator`, `brake`: the pedals.
   * - `gear`: the gear lever's fore-and-aft slide, and `gearKnob` the knob a hand holds, riding it.
   * - `driverBelt`: where the driver's hand takes the belt on the pillar behind the door.
   * - `mirror`: the rear-view mirror's face.
   */
  export type Affordance =
    | "driverDoor"
    | "passengerDoor"
    | "driverDoorHandle"
    | "passengerDoorHandle"
    | "driverAperture"
    | "passengerAperture"
    | "driverSeat"
    | "passengerSeat"
    | "rearSeat"
    | "wheel"
    | "frontLeftWheel"
    | "frontRightWheel"
    | "accelerator"
    | "brake"
    | "gear"
    | "gearKnob"
    | "driverBelt"
    | "mirror";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`, `height`, `wheelbase`: the car's overall sizes.
   * - `wheelDiameter`: a road wheel with its tyre.
   * - `seatHeight`: the seating reference point above the heel's rest, SAE J1100's H30.
   * - `steeringDiameter`: the steering wheel's rim.
   * - `steeringAngle`: the steering wheel's plane from upright, degrees.
   * - `steeringRatio`: steering wheel turn over road wheel turn, a ratio.
   * - `lockTurns`: steering wheel turns from lock to lock, a count.
   * - `doorSwing`: a front door's widest opening, degrees.
   * - `pedalTravel`: how far a pedal is pressed.
   * - `mass`: kerb mass, kilograms.
   */
  export type Dimension =
    | "length"
    | "width"
    | "height"
    | "wheelbase"
    | "wheelDiameter"
    | "seatHeight"
    | "steeringDiameter"
    | "steeringAngle"
    | "steeringRatio"
    | "lockTurns"
    | "doorSwing"
    | "pedalTravel"
    | "mass";

  /** The parameters: the class, the driving side, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which class. */
    kind: Kind;

    /** Which side the driver sits on; left (`+X`) when absent. */
    drive?: "left" | "right";

    /** The model's id, unique in a scene; `car` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by class. */
  export const BANDS: typeof CAR_BANDS = CAR_BANDS;
}
