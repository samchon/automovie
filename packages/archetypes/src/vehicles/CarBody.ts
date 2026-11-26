import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { AutoMovieArchetypeCar } from "./AutoMovieArchetypeCar";

/**
 * A car's body: the layout every part is placed from, and the shell, bonnet and
 * road wheels built on it; `CarRear` builds the boot, the van body and the
 * pickup bed on the same layout.
 *
 * `AutoMovieArchetypeCar` lays the car out once and hands the layout to this
 * module and to `CarCabin`, so every part reads one set of planes: the floor,
 * the belt line, the bulkhead, the pillars and the roof.
 */
export namespace CarBody {
  /**
   * A sedan's bonnet leading edge above the ground, metres: below the 76.9 cm
   * the new-car fleet averaged before bonnets rose to 83.8 cm by 2024
   * (Transport & Environment, as the IET reports,
   * https://engx.theiet.org/b/articles/posts/call-to-cap-rising-car-bonnet-heights-amid-pedestrian-safety-fears,
   * read through a search summary), a sedan standing below the SUVs that raised
   * that average; provisional.
   */
  export const LEADING: number = 0.75;

  /** The front bumper's top above the ground, metres: provisional. */
  export const BUMPER: number = 0.5;

  /** The planes a car is built on, metres in the car's space. */
  export interface ILayout {
    /** The class. */
    kind: AutoMovieArchetypeCar.Kind;

    /** The driver's side: 1 for `+X`, -1 for `-X`. */
    side: number;

    /** The drawn dimensions. */
    d: Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>;

    /** Half the width. */
    half: number;

    /** The front bumper's station. */
    front: number;

    /** The rear bumper's station. */
    rear: number;

    /** The cabin floor's height, the heel's rest. */
    floor: number;

    /** The belt line's height, the doors' top edge and the windows' bottom. */
    belt: number;

    /** The side windows' top edge. */
    window: number;

    /** The roof's height. */
    top: number;

    /** The bulkhead's station, `DOOR_LEAD` ahead of the front doors. */
    firewall: number;

    /**
     * The middle pillar's station, the front doors' rear edge, `DOOR_SPAN`
     * behind their front edge.
     */
    pillar: number;

    /**
     * The rear of the passenger cabin: the rear pillar at the rear doors'
     * trailing edge, a pickup's cab back, a van's rear doors' inner face.
     */
    back: number;

    /** The driver's seating reference point. */
    reference: IAutoMovieVector3;

    /**
     * The driver's accelerator heel point, on the floor below the ball of
     * foot's pedal plane.
     */
    heel: IAutoMovieVector3;

    /**
     * The driver's ball of foot, `AutoMovieArchetypeCar.BALL` up the pedal
     * plane from the heel point.
     */
    ball: IAutoMovieVector3;

    /**
     * The pedal plane's angle from the floor, degrees
     * (`AutoMovieArchetypeCar.pedalPlane`).
     */
    pedal: number;

    /**
     * The steering wheel's centre: `AutoMovieArchetypeCar.WHEEL_AFT` behind the
     * ball of foot and `AutoMovieArchetypeCar.WHEEL_HEIGHT` above the heel
     * point.
     */
    wheel: IAutoMovieVector3;

    /** The front doors' front edge, their hinges' station. */
    door: number;

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
   */
  export function layout(
    kind: AutoMovieArchetypeCar.Kind,
    side: number,
    d: Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>,
  ): ILayout {
    const wheelbase: number = d.wheelbase!;
    // A model whose front overhang was read stands on it; any other takes the measured sedan's share of its overhangs.
    const front: number =
      d.frontOverhang === undefined
        ? wheelbase / 2 +
          (d.length! - wheelbase) * AutoMovieArchetypeCar.OVERHANG
        : wheelbase / 2 + d.frontOverhang;
    const rear: number = front - d.length!;
    const floor: number =
      kind === "van" ? d.sideStep! : AutoMovieArchetypeCar.FLOOR;

    // The front doors from the front axle, the middle pillar their span behind, and the seating reference point just ahead of the pillar, as the measured sedans have them; a pickup takes the same cabin. A van's middle pillar is its bulkhead, which its sheet places by the load length ahead of the rear doors' inner face, their 0.04 m panel inside the rear: a van's cab partition is its B-pillar line, and no source read gives the Transit's front-door or B-pillar station (three searches recorded), so the station is derived from the bulkhead rather than borrowed from the sedans, whose door chain would put the pillar 75.6 mm behind the read bulkhead.
    const door: number = wheelbase / 2 - AutoMovieArchetypeCar.DOOR_AXLE;
    // A van's rear doors' inner face, their 0.04 m panel inside the rear.
    const inside: number = rear + 0.04;
    const pillar: number =
      kind === "van"
        ? inside + d.loadLength!
        : door - AutoMovieArchetypeCar.DOOR_SPAN;
    const sz: number = pillar + AutoMovieArchetypeCar.PILLAR_SGRP;
    const sy: number = floor + d.seatHeight!;
    const sx: number = side * AutoMovieArchetypeCar.OCCUPANT;

    // SAE J1516: the ball of foot lies its tool reference distance ahead of the seating reference point, and the heel point 203 mm back down the pedal plane from it.
    const pedal: number = AutoMovieArchetypeCar.pedalPlane(d.seatHeight!);
    const slope: number = pedal * AutoMovieArchetypeUnits.DEGREE;
    const ball: IAutoMovieVector3 = Vector3.create(
      sx,
      floor + AutoMovieArchetypeCar.BALL * Math.sin(slope),
      sz + AutoMovieArchetypeCar.seatAft(d.seatHeight!),
    );
    const heel: IAutoMovieVector3 = Vector3.create(
      sx,
      floor,
      ball.z - AutoMovieArchetypeCar.BALL * Math.cos(slope),
    );

    // The steering wheel from the ball of foot and the heel point; the firewall ahead of the front doors.
    const wheel: IAutoMovieVector3 = Vector3.create(
      sx,
      heel.y + AutoMovieArchetypeCar.WHEEL_HEIGHT,
      ball.z - AutoMovieArchetypeCar.WHEEL_AFT,
    );
    const firewall: number = door + AutoMovieArchetypeCar.DOOR_LEAD;

    // The belt line from the rocker's lower edge and the windows' top above it, as the measured sedan has them; a pickup's belt is its bed's rail.
    const belt: number =
      kind === "pickup"
        ? d.bedFloor! + d.bedDepth!
        : AutoMovieArchetypeCar.ROCKER + AutoMovieArchetypeCar.BELT;
    return {
      kind,
      side,
      d,
      half: d.width! / 2,
      front,
      rear,
      floor,
      belt,
      window: belt + AutoMovieArchetypeCar.WINDOW,
      top: d.height!,
      firewall,
      pillar,
      back:
        kind === "van"
          ? inside
          : kind === "pickup"
            ? rear + d.bedLength!
            : door - AutoMovieArchetypeCar.REAR_DOOR,
      reference: Vector3.create(sx, sy, sz),
      heel,
      ball,
      pedal,
      wheel,
      door,
      surface: sy - AutoMovieArchetypeCar.HIP,
    };
  }

  /**
   * The shell: the floor, the front bumper, the bonnet rising from its leading
   * edge to the windscreen's foot with its lid on a hinge, and the roof on its
   * pillars; `CarRear` builds what the class carries behind the cabin.
   *
   * @param builder The car under construction.
   * @param l The layout.
   */
  export function shell(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCar.Affordance,
      AutoMovieArchetypeCar.Dimension
    >,
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
    // The front in profile: the bumper's face up to `BUMPER`, the bonnet's
    // leading edge as far below the belt as a sedan's `LEADING` sits below
    // its belt, and the bonnet rising from it to the belt at the
    // windscreen's foot.
    const lead: number =
      l.belt -
      (AutoMovieArchetypeCar.ROCKER +
        AutoMovieArchetypeCar.BELT -
        CarBody.LEADING);
    const x: number = width / 2;
    builder.box(
      "bumper",
      v(width, CarBody.BUMPER - l.floor, 0.12),
      v(0, (CarBody.BUMPER + l.floor) / 2, l.front - 0.06),
      { color: BODY },
    );
    builder.convex(
      "bonnet",
      [
        v(-x, l.floor, l.front - 0.12),
        v(x, l.floor, l.front - 0.12),
        v(-x, lead, l.front),
        v(x, lead, l.front),
        v(-x, l.floor, l.firewall),
        v(x, l.floor, l.firewall),
        v(-x, l.belt, l.firewall),
        v(x, l.belt, l.firewall),
      ],
      undefined,
      { color: BODY },
    );
    // The lid's vertices about its own centre, so its frame is its middle
    // and the hinge turns it about its rear edge.
    const lid: number = 0.03;
    const middle: IAutoMovieVector3 = v(
      0,
      (lead + l.belt + lid) / 2,
      (l.front + l.firewall) / 2,
    );
    builder.convex(
      "bonnet-lid",
      [
        v(-x + 0.02, lead, l.front),
        v(x - 0.02, lead, l.front),
        v(-x + 0.02, lead + lid, l.front),
        v(x - 0.02, lead + lid, l.front),
        v(-x + 0.02, l.belt, l.firewall),
        v(x - 0.02, l.belt, l.firewall),
        v(-x + 0.02, l.belt + lid, l.firewall),
        v(x - 0.02, l.belt + lid, l.firewall),
      ].map(
        (point: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.subtract(point, middle),
      ),
      middle,
      { color: BODY },
    );
    builder.affordance({
      id: "bonnet",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
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
   * The road wheels: each on a `knob` that spins it about its axle, the front
   * pair's knobs riding their steering, which follows the steering wheel by its
   * Ackermann angle (`AutoMovieArchetypeCar.ackermann`).
   *
   * @param builder The car under construction.
   * @param l The layout.
   */
  export function wheels(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCar.Affordance,
      AutoMovieArchetypeCar.Dimension
    >,
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
        { color: TYRE, surface: "rubber" },
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
          AutoMovieArchetypeCar.ackermann(
            steering / ratio,
            wheelbase,
            (x * track) / 2,
          );

        // Rows each side of straight, so straight ahead is a row and gives straight wheels exactly.
        const rows: number = Math.ceil(
          lock / ratio / AutoMovieArchetypeCar.STEER_STEP,
        );
        builder.affordance({
          id: steer,
          kind: "wheel",
          frame: AutoMovieArchetypeFrame.facing(centre, v(0, 1, 0), v(0, 0, 1)),
          extent: null,
          travel: AutoMovieArchetypeCar.ackermann(
            lock / ratio,
            wheelbase,
            track / 2,
          ),
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
        frame: AutoMovieArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts: [`wheel-${name}`, `hub-${name}`],
        ...(steer === null ? {} : { rides: steer }),
      });
    }
  }

  /**
   * A van's bulkhead station, its face toward the cargo: its middle pillar,
   * behind the front seats' backrests, so the cargo space and the sliding
   * door's opening begin there.
   *
   * @param l The layout.
   * @returns The station, metres along `+Z`.
   */
  export function bulkhead(l: ILayout): number {
    return l.pillar;
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
