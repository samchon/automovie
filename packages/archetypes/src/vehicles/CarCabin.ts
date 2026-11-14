import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { CarBody } from "./CarBody";
import { createCar } from "./createCar";

/**
 * A car's cabin: its doors with their windows and openings, its seats with their reclining backs, and the driver's controls, all placed on `CarBody`'s layout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and what it reads.
 * @evidence contracts/development/design.md#principled-representation Hinged and sliding leaves, sliding glass and reclining backs as articulations on the layout's planes, the controls at offsets from the seating reference point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three builders `createCar` calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every door, window and back is one helper over its side and station, not a copy per position.
 */
export namespace CarCabin {
  /**
   * The doors: the front pair; the rear pair on a sedan, a hatchback and a pickup; a van's sliding door on its kerb side. Each hinged door has its handle and the opening behind it, and each side window slides down into its door with an opening that grows above it.
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which class has which door and what each carries.
   * @evidence contracts/development/implementation.md#principled-implementation A hinged door's axis is its front edge with `+Y` pointing so a positive travel swings it outward; its window is a `slider` riding it, running down along `+X` by the glass's height; the window's opening is an `aperture` riding the glass, its threshold the glass's top edge, so the clear opening is the window frame's top less that threshold and grows to `height` as the glass goes down. A van's sliding door runs back along the side by its opening's width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper per door, called per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A sliding door runs inside the side wall's plane, not out and along it as its track does; stated, not hidden.
   * @evidence contracts/development/implementation.md#efficient-algorithms A few parts per door.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function doors(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    door(builder, l, "driver", l.side, l.firewall, l.pillar, true);
    door(builder, l, "passenger", -l.side, l.firewall, l.pillar, true);
    if (l.kind !== "van") {
      door(builder, l, "rearLeft", 1, l.pillar, l.back, false);
      door(builder, l, "rearRight", -1, l.pillar, l.back, false);
      return;
    }

    // The van's sliding door, behind the bulkhead on the kerb side.
    const v: typeof Vector3.create = Vector3.create;
    const kerb: number = -l.side;
    const width: number = l.d.sideDoorWidth!;
    const height: number = l.d.sideDoorHeight!;
    const start: number = CarBody.bulkhead(l);
    const middle: number = start - width / 2;
    const x: number = kerb * l.half;
    builder.box("door-sliding", v(0.04, height, width), v(x, l.floor + height / 2, middle), {
      color: DOOR,
    });
    builder.affordance({
      id: "slidingDoor",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(x, l.floor + height / 2, middle), v(kerb, 0, 0), v(0, 0, -1)),
      extent: null,
      grip: "hook",
      travel: width,
      parts: ["door-sliding"],
    });
    builder.affordance({
      id: "slidingAperture",
      kind: "aperture",
      frame: ArchetypeFrame.facing(v(x, l.floor, middle), v(0, 1, 0), v(0, 0, -kerb)),
      extent: null,
      width,
      height,
    });
  }

  /**
   * The seats: the front pair and, except in a van, the rear bench, each with its back on a reclining hinge.
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which seats each class has.
   * @evidence contracts/development/implementation.md#principled-implementation Each seat is a cushion whose `seat` affordance sits on its front edge facing forward, laid out from the seating reference point; its back turns about the cushion's rear edge with `+Y` along `-X`, so a positive travel tips its top back toward `-Z`, by up to `recline`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper per seat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None beyond the layout's marked constants.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A few parts per seat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function seats(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    const reference: IAutoMovieVector3 = l.reference;
    seat(builder, l, "driverSeat", "driver", Vector3.create(reference.x, l.surface, reference.z), 0.5);
    seat(builder, l, "passengerSeat", "passenger", Vector3.create(-reference.x, l.surface, reference.z), 0.5);
    if (l.kind !== "van")
      seat(builder, l, "rearSeat", "rear", Vector3.create(0, l.surface, reference.z - 0.8), l.d.width! - 0.3);
  }

  /**
   * The driver's controls: the steering wheel, the pedals, the gear lever, the belt and the mirror.
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built.
   * @evidence contracts/development/implementation.md#principled-implementation The steering wheel's rim on its column's axis tilted back by `steeringAngle` at `WHEEL` from the seating reference point, turning half the lock-to-lock turn each way with one spoke across it so a turn shows; the pedals' plates face the sole in the footwell `HEEL` ahead of the reference point; the gear lever slides fore and aft between the seats.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Wheel, pedals, lever, belt, mirror.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offsets are `createCar`'s marked constants.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function controls(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: CarBody.ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const d: Readonly<Partial<Record<createCar.Dimension, number>>> = l.d;
    const sx: number = l.reference.x;
    const sz: number = l.reference.z;
    const tilt: number = (d.steeringAngle! * Math.PI) / 180;
    const axis: IAutoMovieVector3 = v(0, Math.sin(tilt), -Math.cos(tilt));
    const hub: IAutoMovieVector3 = v(sx, l.reference.y + createCar.WHEEL.up, sz + createCar.WHEEL.ahead);
    builder.rod("steering-rim", d.steeringDiameter! / 2, Vector3.subtract(hub, Vector3.scale(axis, 0.015)), Vector3.add(hub, Vector3.scale(axis, 0.015)), { color: DARK });
    builder.rod("steering-column", 0.02, Vector3.subtract(hub, Vector3.scale(axis, 0.3)), hub, { color: GREY });
    builder.rod(
      "steering-spoke",
      0.008,
      Vector3.add(hub, Vector3.add(Vector3.scale(axis, 0.02), v(-d.steeringDiameter! / 2, 0, 0))),
      Vector3.add(hub, Vector3.add(Vector3.scale(axis, 0.02), v(d.steeringDiameter! / 2, 0, 0))),
      { color: METAL },
    );
    builder.affordance({
      id: "wheel",
      kind: "wheel",
      frame: ArchetypeFrame.facing(hub, axis, v(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: 0.03,
      radius: d.steeringDiameter! / 2,
      travel: d.lockTurns! * 180,
      parts: ["steering-rim", "steering-spoke"],
    });

    // The pedals in the footwell behind the bulkhead, the accelerator under the right foot and the brake beside it.
    const heel: number = sz + createCar.HEEL;
    const sole: IAutoMovieVector3 = v(0, 0.5, -0.866);
    for (const [id, offset, width] of [
      ["accelerator", -0.1, 0.05],
      ["brake", 0.02, 0.1],
    ] as const) {
      const at: IAutoMovieVector3 = v(sx + offset, l.floor + 0.15, heel + 0.1);
      builder.box(`pedal-${id}`, v(width, 0.01, 0.08), at, {
        color: DARK,
        rotation: ArchetypeFrame.facing(at, sole, v(1, 0, 0)).rotation,
      });
      builder.affordance({
        id,
        kind: "pedal",
        frame: ArchetypeFrame.facing(Vector3.add(at, Vector3.scale(sole, 0.005)), sole, v(1, 0, 0)),
        extent: null,
        width,
        depth: 0.08,
        travel: d.pedalTravel!,
        parts: [`pedal-${id}`],
      });
    }

    // The gear lever between the seats, its knob slid fore and aft.
    const knob: IAutoMovieVector3 = v(0, l.surface + 0.15, sz + 0.25);
    builder.rod("gear-lever", 0.012, v(0, l.floor, sz + 0.25), knob, { color: GREY });
    builder.ball("gear-knob", 0.025, knob, { color: DARK });
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
      frame: ArchetypeFrame.facing(v(l.side * (l.half - 0.05), l.reference.y + 0.5, l.pillar), v(-l.side, 0, 0), v(0, 1, 0)),
      extent: null,
      grip: "precision",
    });
    builder.affordance({
      id: "mirror",
      kind: "surface",
      frame: ArchetypeFrame.facing(v(0, l.top - 0.12, l.firewall - 0.4), v(0, 0, -1), v(1, 0, 0)),
      extent: null,
    });
  }
}

/** A door's colour. */
const DOOR: string = "#355c7a";

/** A seat's colour. */
const CLOTH: string = "#6f7f93";

/** Glass's colour. */
const GLASS: string = "#a9c4d6";

/** A dark trim's colour. */
const DARK: string = "#22262b";

/** A grey trim's colour. */
const GREY: string = "#55595f";

/** Bright metal's colour. */
const METAL: string = "#c9ccd1";

/** The body's colour. */
const BODY: string = "#3f6c8f";

/**
 * Add one hinged door: its leaf, handle and middle pillar, its hinge, handle and opening, and its sliding window with the window's opening.
 *
 * @param builder The car under construction.
 * @param l The layout.
 * @param role The door's name in its ids.
 * @param sign The side it is on, 1 for `+X`.
 * @param hinge The station of its front edge, where it is hinged.
 * @param end The station of its rear edge.
 * @param pillar Whether a middle pillar stands at its rear edge.
 */
function door(
  builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
  l: CarBody.ILayout,
  role: "driver" | "passenger" | "rearLeft" | "rearRight",
  sign: number,
  hinge: number,
  end: number,
  pillar: boolean,
): void {
  const v: typeof Vector3.create = Vector3.create;
  const x: number = sign * l.half;
  const part: string = `door-${PART[role]}`;
  builder.box(part, v(0.04, l.belt - l.floor, hinge - end), v(x, (l.belt + l.floor) / 2, (hinge + end) / 2), { color: DOOR });
  builder.rod(`door-handle-${PART[role]}`, 0.01, v(x + sign * 0.03, l.belt - 0.08, end + 0.18), v(x + sign * 0.03, l.belt - 0.08, end + 0.06), { color: METAL });
  if (pillar)
    builder.rod(`pillar-mid-${PART[role]}`, 0.03, v(sign * (l.half - 0.03), l.belt, end), v(sign * (l.half - 0.03), l.top - 0.04, end), { color: BODY });
  builder.affordance({
    id: `${role}Door`,
    kind: "hinge",
    frame: ArchetypeFrame.facing(v(x, (l.belt + l.floor) / 2, hinge), v(0, -sign, 0), v(0, 0, -1)),
    extent: null,
    travel: l.d.doorSwing!,
    parts: [part, `door-handle-${PART[role]}`],
  });
  builder.affordance({
    id: `${role}DoorHandle`,
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(v(x + sign * 0.03, l.belt - 0.08, end + 0.12), v(sign, 0, 0), v(0, 0, 1)),
    extent: null,
    grip: "hook",
    aperture: 0.02,
    length: 0.12,
    rides: `${role}Door`,
  });
  builder.affordance({
    id: `${role}Aperture`,
    kind: "aperture",
    frame: ArchetypeFrame.facing(v(x, l.floor, (hinge + end) / 2), v(0, 1, 0), v(0, 0, sign)),
    extent: null,
    width: hinge - end,
    height: l.top - 0.04 - l.floor,
  });

  // The window between the door's edges, clear of the windscreen's slope at the front, sliding down into the door.
  const forward: number = role === "driver" || role === "passenger" ? l.firewall - 0.38 : hinge - 0.03;
  const length: number = forward - (end + 0.03);
  const height: number = l.top - 0.04 - l.belt;
  const middle: number = (forward + end + 0.03) / 2;
  const glass: string = `window-${PART[role]}`;
  builder.box(glass, v(0.01, height, length), v(x, l.belt + height / 2, middle), { color: GLASS, density: 0.5 });
  builder.affordance({
    id: `${role}Window`,
    kind: "slider",
    frame: ArchetypeFrame.facing(v(x, l.top - 0.04, middle), v(sign, 0, 0), v(0, -1, 0)),
    extent: null,
    travel: height,
    parts: [glass],
    rides: `${role}Door`,
  });
  builder.affordance({
    id: `${role}WindowOpening`,
    kind: "aperture",
    frame: ArchetypeFrame.facing(v(x, l.top - 0.04, middle), v(0, 1, 0), v(0, 0, sign)),
    extent: null,
    width: length,
    height,
    rides: `${role}Window`,
  });
}

/**
 * Add one seat: a cushion and a back, its `seat` affordance on the cushion's front edge facing forward, and the back's reclining hinge.
 *
 * @param builder The car under construction.
 * @param l The layout.
 * @param id The seat's affordance id.
 * @param name Its name in part ids.
 * @param reference The middle of the cushion's surface under the seating reference point, which lies 0.1 m ahead of the back.
 * @param width The cushion's width.
 */
function seat(
  builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
  l: CarBody.ILayout,
  id: "driverSeat" | "passengerSeat" | "rearSeat",
  name: string,
  reference: IAutoMovieVector3,
  width: number,
): void {
  const depth: number = 0.48;
  const rear: number = reference.z - 0.1;
  builder.box(`cushion-${name}`, Vector3.create(width, 0.12, depth), Vector3.create(reference.x, reference.y - 0.06, rear + depth / 2), { color: CLOTH, density: 0.2 });
  builder.box(`backrest-${name}`, Vector3.create(width, 0.6, 0.1), Vector3.create(reference.x, reference.y + 0.3, rear - 0.05), { color: CLOTH, density: 0.2 });
  builder.affordance({
    id,
    kind: "seat",
    frame: ArchetypeFrame.upright(Vector3.create(reference.x, reference.y, rear + depth)),
    extent: null,
    depth,
    width,
    back: 0.6,
  });
  builder.affordance({
    id: `${id}Back`,
    kind: "hinge",
    frame: ArchetypeFrame.facing(Vector3.create(reference.x, reference.y, rear), Vector3.create(-1, 0, 0), Vector3.create(0, 1, 0)),
    extent: null,
    travel: l.d.recline!,
    parts: [`backrest-${name}`],
  });
}

/** Each door's name in part ids, as the front doors' were before the rear doors came. */
const PART: Readonly<Record<"driver" | "passenger" | "rearLeft" | "rearRight", string>> = {
  driver: "driver",
  passenger: "passenger",
  rearLeft: "rear-left",
  rearRight: "rear-right",
};
