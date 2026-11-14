import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { createCar } from "./createCar";

/**
 * A car's body: the layout every part is placed from, and the shell, bonnet and road wheels built on it; `CarRear` builds the boot, the van body and the pickup bed on the same layout.
 *
 * `createCar` lays the car out once and hands the layout to this module and to `CarCabin`, so every part reads one set of planes: the floor, the belt line, the bulkhead, the pillars and the roof.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and why the layout is shared.
 * @evidence contracts/development/design.md#principled-representation Named planes of the body derived once from the drawn dimensions and the seating reference point, as SAE J1100 lays out a package.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The layout record and the body's builders, called by `createCar`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No plane is restated by a builder; each reads it from the layout.
 */
export namespace CarBody {
  /**
   * The planes a car is built on, metres in the car's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning.
   * @evidence contracts/development/design.md#principled-representation Heights and fore-and-aft stations in metres, the driving side as a sign, and the drawn dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `layout` and read by this module's builders and `CarCabin`'s.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The dimensions a class lacks stay absent, read only by the builders of the parts that class has.
   */
  export interface ILayout {
    /** The class. */
    kind: createCar.Kind;

    /** The driver's side: 1 for `+X`, -1 for `-X`. */
    side: number;

    /** The drawn dimensions. */
    d: Readonly<Partial<Record<createCar.Dimension, number>>>;

    /** Half the width. */
    half: number;

    /** The front bumper's station. */
    front: number;

    /** The rear bumper's station. */
    rear: number;

    /** The cabin floor's height, the heel's rest. */
    floor: number;

    /** The belt line's height, the doors' top edge. */
    belt: number;

    /** The roof's height. */
    top: number;

    /** The bulkhead's station, the front doors' front edge. */
    firewall: number;

    /** The middle pillar's station, the front doors' rear edge. */
    pillar: number;

    /** The rear of the passenger cabin: the rear pillar, a pickup's cab back, a van's rear doors' inner face. */
    back: number;

    /** The driver's seating reference point. */
    reference: IAutoMovieVector3;

    /** The driver's accelerator heel point, on the floor below the ball of foot's pedal plane. */
    heel: IAutoMovieVector3;

    /** The driver's ball of foot, `createCar.BALL` up the pedal plane from the heel point. */
    ball: IAutoMovieVector3;

    /** The pedal plane's angle from the floor, degrees (`createCar.pedalPlane`). */
    pedal: number;

    /** The seat cushion's top under the reference point. */
    surface: number;
  }

  /**
   * The layout of a car from its class, its driving side and its dimensions.
   *
   * @param kind The class.
   * @param side The driver's side, 1 or -1.
   * @param d The drawn dimensions.
   * @returns The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The front overhang takes 45 % of the length beyond the wheelbase; the seating reference point lies `REFERENCE` behind the front axle and `seatHeight` above the floor (SAE J1100's H30); the ball of foot lies SAE J1516's tool reference distance ahead of it (`seatAft`) on the pedal plane at J1516's angle (`pedalPlane`), the heel point `BALL` back down that plane on the floor, and the bulkhead `FOOTWELL` ahead of the heel point; the belt `BELT` above the floor, or a pickup's at its bed's rail; a van's floor is its side step and its cabin runs to its rear doors, a pickup's cab ends where its bed begins.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of derived planes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The unsourced offsets are `createCar`'s marked constants.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function layout(
    kind: createCar.Kind,
    side: number,
    d: Readonly<Partial<Record<createCar.Dimension, number>>>,
  ): ILayout {
    const wheelbase: number = d.wheelbase!;
    const front: number = wheelbase / 2 + (d.length! - wheelbase) * 0.45;
    const rear: number = front - d.length!;
    const floor: number = kind === "van" ? d.sideStep! : createCar.FLOOR;
    const sz: number = wheelbase / 2 - createCar.REFERENCE;
    const sy: number = floor + d.seatHeight!;
    const sx: number = side * (d.width! / 4);

    // SAE J1516: the ball of foot lies its tool reference distance ahead of the seating reference point, and the heel point 203 mm back down the pedal plane from it.
    const pedal: number = createCar.pedalPlane(d.seatHeight!);
    const slope: number = (pedal * Math.PI) / 180;
    const ball: IAutoMovieVector3 = Vector3.create(sx, floor + createCar.BALL * Math.sin(slope), sz + createCar.seatAft(d.seatHeight!));
    const heel: IAutoMovieVector3 = Vector3.create(sx, floor, ball.z - createCar.BALL * Math.cos(slope));
    return {
      kind,
      side,
      d,
      half: d.width! / 2,
      front,
      rear,
      floor,
      belt:
        kind === "pickup"
          ? d.bedFloor! + d.bedDepth!
          : floor + createCar.BELT,
      top: d.height!,
      firewall: heel.z + createCar.FOOTWELL,
      pillar: sz - 0.25,
      back:
        kind === "van"
          ? rear + 0.04
          : kind === "pickup"
            ? rear + d.bedLength!
            : -wheelbase / 2 + 0.1,
      reference: Vector3.create(sx, sy, sz),
      heel,
      ball,
      pedal,
      surface: sy - createCar.HIP,
    };
  }

  /**
   * The shell: the floor, the bonnet with its lid on a hinge, and the roof on its pillars; `CarRear` builds what the class carries behind the cabin.
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built.
   * @evidence contracts/development/implementation.md#principled-implementation Boxes and rods on the layout's planes. The bonnet's hinge lies on its rear edge with `+Y` along `-X`, so a positive turn lifts its front edge, the right-hand rule taking `+Z` toward `+Y`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The common shell only.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None beyond the layout's marked constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms A few tens of parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shell(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const width: number = l.d.width!;
    builder.box(
      "floor",
      v(width, 0.12, l.front - l.rear),
      v(0, l.floor - 0.06, (l.front + l.rear) / 2),
      { color: BODY },
    );
    builder.box(
      "bonnet",
      v(width, l.belt - l.floor, l.front - l.firewall),
      v(0, (l.belt + l.floor) / 2, (l.front + l.firewall) / 2),
      { color: BODY },
    );
    builder.box(
      "bonnet-lid",
      v(width - 0.04, 0.03, l.front - l.firewall),
      v(0, l.belt + 0.015, (l.front + l.firewall) / 2),
      { color: BODY },
    );
    builder.affordance({
      id: "bonnet",
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        v(0, l.belt + 0.03, l.firewall),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: l.d.bonnetSwing!,
      parts: ["bonnet-lid"],
    });
    builder.box(
      "roof",
      v(width, 0.04, l.firewall - 0.35 - l.back),
      v(0, l.top - 0.02, (l.firewall - 0.35 + l.back) / 2),
      { color: BODY },
    );
    for (const [name, x, z0, z1] of [
      ["pillar-front-left", l.half - 0.03, l.firewall, l.firewall - 0.35],
      ["pillar-front-right", -l.half + 0.03, l.firewall, l.firewall - 0.35],
      ["pillar-rear-left", l.half - 0.03, l.back, l.back],
      ["pillar-rear-right", -l.half + 0.03, l.back, l.back],
    ] as const)
      builder.rod(name, 0.03, v(x, l.belt, z0), v(x, l.top - 0.04, z1), {
        color: BODY,
      });
  }

  /**
   * The road wheels: each on a `knob` that spins it about its axle, the front pair's knobs riding their steering, which follows the steering wheel by its Ackermann angle (`createCar.ackermann`).
   *
   * @param builder The car under construction.
   * @param l The layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chain of articulations.
   * @evidence contracts/development/implementation.md#principled-implementation Each wheel stands out to the doors' outer faces with a hub bar across its face, so a spin shows. A spin knob's `+Y` is the car's `+X`, so a positive turn rolls the wheel's top forward, toward `+Z`, as rolling forward does; `driveCar` sets it from the distance. The steering is a two-sided `wheel` articulation about the upright through the wheel's centre, following `wheel` through a table of Ackermann angles at `STEER_STEP` spacing with a row at straight ahead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the four wheels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The steering table is interpolated linearly, within a hundredth of a degree of the exact angle, as `STEER_STEP` states.
   * @evidence contracts/development/implementation.md#efficient-algorithms A table of about eighty rows per front wheel.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function wheels(
    builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension>,
    l: ILayout,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const wheelbase: number = l.d.wheelbase!;
    const radius: number = l.d.wheelDiameter! / 2;
    const ratio: number = l.d.steeringRatio!;
    const lock: number = l.d.lockTurns! * 180;
    const track: number = 2 * (l.half - 0.08);
    for (const [name, x, z] of [
      ["front-left", 1, wheelbase / 2],
      ["front-right", -1, wheelbase / 2],
      ["rear-left", 1, -wheelbase / 2],
      ["rear-right", -1, -wheelbase / 2],
    ] as const) {
      const centre: IAutoMovieVector3 = v((x * track) / 2, radius, z);
      builder.rod(
        `wheel-${name}`,
        radius,
        v(x * (l.half - 0.18), radius, z),
        v(x * (l.half + 0.02), radius, z),
        { color: TYRE },
      );
      builder.box(
        `hub-${name}`,
        v(0.01, radius * 1.6, 0.05),
        v(x * (l.half + 0.025), radius, z),
        { color: METAL },
      );
      const steer: "frontLeftWheel" | "frontRightWheel" | null =
        name === "front-left"
          ? "frontLeftWheel"
          : name === "front-right"
            ? "frontRightWheel"
            : null;
      if (steer !== null) {
        const angle = (steering: number): number =>
          createCar.ackermann(steering / ratio, wheelbase, (x * track) / 2);

        // Rows each side of straight, so straight ahead is a row and gives straight wheels exactly.
        const rows: number = Math.ceil(lock / ratio / createCar.STEER_STEP);
        builder.affordance({
          id: steer,
          kind: "wheel",
          frame: ArchetypeFrame.facing(centre, v(0, 1, 0), v(0, 0, 1)),
          extent: null,
          travel: createCar.ackermann(lock / ratio, wheelbase, track / 2),
          follows: {
            id: "wheel",
            table: Array.from(
              { length: 2 * rows + 1 },
              (_: unknown, k: number): [number, number] => {
                const steering: number =
                  k === 0
                    ? -lock
                    : k === 2 * rows
                      ? lock
                      : (lock * (k - rows)) / rows;
                return [steering, angle(steering)];
              },
            ),
          },
        });
      }
      builder.affordance({
        id: SPIN[name],
        kind: "knob",
        frame: ArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts: [`wheel-${name}`, `hub-${name}`],
        ...(steer === null ? {} : { rides: steer }),
      });
    }
  }

  /**
   * A van's bulkhead station, its face toward the cargo: behind the front seats' backrests, so the cargo space and the sliding door's opening begin there.
   *
   * @param l The layout.
   * @returns The station, metres along `+Z`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it places and why.
   * @evidence contracts/development/implementation.md#principled-implementation The van's sheet gives the load length to the bulkhead, so the bulkhead's face stands that far ahead of the rear doors' inner face, their 0.04 m panel inside the rear.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression, read by this module and `CarCabin`.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bulkhead(l: ILayout): number {
    return l.rear + 0.04 + l.d.loadLength!;
  }

}

/** The body's colour. */
const BODY: string = "#3f6c8f";

/** A tyre's colour. */
const TYRE: string = "#22262b";

/** Bright metal's colour. */
const METAL: string = "#c9ccd1";

/** Each road wheel's spin knob. */
const SPIN: Readonly<
  Record<
    "front-left" | "front-right" | "rear-left" | "rear-right",
    "frontLeftSpin" | "frontRightSpin" | "rearLeftSpin" | "rearRightSpin"
  >
> = {
  "front-left": "frontLeftSpin",
  "front-right": "frontRightSpin",
  "rear-left": "rearLeftSpin",
  "rear-right": "rearRightSpin",
};
