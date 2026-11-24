import {
  AutoMovieArchetypeRefusal,
  createWheelchair,
  rideWheelchair,
  wheelchairHandrimFrame,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHandrimStroke,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { catalogueWheelchair } from "../../../features/internal/catalogueWheelchair";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/** The two independently tracked sides of the chair. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The established motion support tolerance in metres. */
const SUPPORT_GAP: number = 0.01;

/** A millimetre for floor contacts measured from the posed model parts. */
const FLOOR_GAP: number = 0.001;

/**
 * A seated performer takes two rims to accelerate, then the inside rim to
 * brake around its stationary wheel and recover the free hands.
 *
 * Scenarios
 * 1. Measure the chair path and distinct rear wheel travel, both rear wheels
 *    and front casters on the floor, and the fixed pelvis offset throughout.
 * 2. Read rim engagement, catch and release velocity, and seated recovery.
 *    Replay reads out of order.
 * 3. Refuse overlapping material selections for the same hand while
 *    admitting overlapping selections on different wheels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two travel acts, their support and the per-hand overlap rule.
 * @evidence contracts/development/testing.md#behavioral-verification Plays one public HumanChain through two handrim strokes and samples displayed bones, wheel articulation and pose. Exercises the range admission of the shared handrim reader.
 * @evidence contracts/development/testing.md#independent-expectations The straight distance uses elementary constant acceleration. The pivot uses a circular axle midpoint around the fixed inner hub. The established straight-stroke witness supplies the wrist offset and 10 mm fit tolerance. A seat-only performance supplies the neutral pelvis and wrists. One-sided finite differences across the boundaries should converge as the measuring interval halves.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes bilateral acceleration from a unilateral brake, stationary from rotating wheel, and contact from release, neutral hand recovery and schedule overlap.
 * @evidence contracts/development/testing.md#execution-ownership One seeded wheelchair and canonical Human body run through in-memory motion entry points and model parts. No host is required.
 */
export function test_motion_ride_wheelchair_travel(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("wheelchair travel", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  // The chair fitted to the rider: the narrowest read seat that holds its
  // hips, so the rims lie within its arms.
  const chair: ReturnType<typeof createWheelchair> = catalogueWheelchair(
    body,
    "selfPropelled",
    2,
  );
  const position: IAutoMovieVector3 = { x: 2, y: 0, z: -1 };
  const heading: number = 63;
  const origin: IAutoMovieRigidTransform = HumanObject.frame({
    at: position,
    yaw: heading,
  });
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    chair,
    origin,
  );
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(origin.rotation, {
    x: 0,
    y: 0,
    z: 0.2,
  });
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "rider",
    body,
    at: { x: seat.at.x + forward.x, y: 0, z: seat.at.z + forward.z },
    yaw: seat.yaw,
    proficiency: { level: "trained" },
  };
  const seed: string = "wheelchair-travel";
  const sit: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "rider",
  ).sit({ seat });
  const rest: HumanPerformance = new HumanPerformance({
    seed,
    performers: [performer],
    composition: sit.node,
  });

  const rims: IAutoMovieMotionHumanHandrimStroke["rims"] = {
    left: "leftRim",
    right: "rightRim",
  };
  const stroke: IAutoMovieMotionHumanHandrimStroke = {
    on: "chair",
    rims,
    approach: 0.45,
    push: 0.32,
    recovery: 0.45,
  };
  const initialCatch: number = rest.duration + stroke.approach;
  const initialRelease: number =
    rest.duration + (stroke.approach + stroke.push);
  const brakeStart: number =
    rest.duration + (stroke.approach + stroke.push + stroke.recovery);
  const radius: number = chair.affordance("leftSpin").frame.translation.x;
  const wheel: number = chair.dimensions.wheelDiameter! / 2;
  const angle: number = 35;
  const turn: number = angle * Quaternion.DEG2RAD;
  const straight: number = 0.4;
  const cruise: number = 0.45;
  const acceleration: number = 0.9;
  const deceleration: number = 0.6;
  const departureAcceleration: number = cruise / acceleration;
  const arrivalBraking: number = cruise / deceleration;
  const straightSeconds: number = straight / cruise + departureAcceleration / 2;
  const turnSeconds: number = (radius * turn) / cruise + arrivalBraking / 2;
  const departure: number = rest.duration + 0.3;
  const progressAtCatch: number =
    0.5 * acceleration * (initialCatch - departure) ** 2;
  const pivotAt: number = departure + straightSeconds;
  const ride: ReturnType<typeof rideWheelchair> = rideWheelchair(chair, {
    start: { x: position.x, z: position.z, heading },
    at: departure,
    legs: [
      { kind: "straight", length: straight },
      { kind: "turn", radius, angle },
    ],
    cruise,
    acceleration,
    deceleration,
    speeds: [cruise, 0],
  });
  const brake: IAutoMovieMotionHumanHandrimStroke = {
    on: "chair",
    rims,
    hand: "left",
    approach: pivotAt - brakeStart,
    push: turnSeconds,
    recovery: 0.7,
  };
  const brakeCatch: number = brakeStart + brake.approach;
  const brakeRelease: number = brakeStart + (brake.approach + brake.push);
  const holds: readonly rideWheelchair.IHandrimHold[] = [
    { catchAt: initialCatch, releaseAt: initialRelease, degrees: -15 },
    { catchAt: brakeCatch, releaseAt: brakeRelease, degrees: 12, side: "left" },
  ];
  const part: ReturnType<typeof rideWheelchair.handrimContacts> =
    rideWheelchair.handrimContacts(ride, holds);
  const pose = (film: number): IAutoMovieRigidTransform => {
    const placed: IAutoMovieTransform = ride.at(film).placement;
    return { position: placed.translation, rotation: placed.rotation };
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed,
    performers: [performer],
    laws: [
      AutoMovieMotionHumanRide.handrimStroke,
      AutoMovieMotionHumanMount.rideHorse.ride,
    ],
    props: [
      HumanObject.prop("chair", chair, origin, pose, (id, film) =>
        part(id as createWheelchair.Affordance, film),
      ),
    ],
    composition: sit
      .registered("handrimStroke", stroke, "accelerate")
      .registered("handrimStroke", brake, "brake")
      .registered("ride", { on: "chair", duration: 0.2 }).node,
  });
  collectTakeClean(
    `${key} wheelchair travel performance`,
    performance,
    failures,
  );
  const push: IAutoMovieMotionHumanSegment = performance.segments("rider")[1]!;
  const stop: IAutoMovieMotionHumanSegment = performance.segments("rider")[2]!;
  const ready: IAutoMovieMotionHumanSegment = performance.segments("rider")[3]!;
  const checks: string[] = [];
  const check = (pass: boolean, fact: string): void => {
    if (!pass) checks.push(fact);
  };
  check(
    ready.context.entry.holds.left === undefined &&
      ready.context.entry.holds.right === undefined &&
      !ready.plan.contacts.some(({ kind }): boolean => kind === "grip"),
    "the next carried phrase enters with both hands unoccupied",
  );
  const front: IAutoMovieVector3 = Quaternion.rotateVector(origin.rotation, {
    x: radius * (1 - Math.cos(turn)),
    y: 0,
    z: straight + radius * Math.sin(turn),
  });
  const final: ReturnType<typeof ride.at> = ride.at(brakeRelease);
  const yaw: IAutoMovieVector3 = Quaternion.rotateVector(
    final.placement.rotation,
    { x: 0, y: 0, z: 1 },
  );
  check(
    vclose(final.placement.translation, Vector3.add(position, front), 1e-6) &&
      vclose(
        yaw,
        {
          x: Math.sin((heading + angle) * Quaternion.DEG2RAD),
          y: 0,
          z: Math.cos((heading + angle) * Quaternion.DEG2RAD),
        },
        1e-6,
      ) &&
      nclose(final.course.speed, 0, 1e-6),
    "arrives at the analytic axle-midpoint arc tangent from rest",
  );

  const innerLocal: IAutoMovieVector3 =
    chair.affordance("leftSpin").frame.translation;
  const inner: IAutoMovieVector3 = world(pose(brakeCatch), innerLocal);
  const restBones: ReturnType<HumanPerformance["bones"]> = rest.bones(
    "rider",
    rest.duration,
  );
  const neutralSeat: IAutoMovieVector3 = local(origin, pelvis(body, restBones));
  const phases: readonly {
    from: number;
    to: number;
    recovery: number;
    drive: boolean;
    record: IAutoMovieMotionHumanSegment;
  }[] = [
    {
      from: initialCatch,
      to: initialRelease,
      recovery: stroke.recovery,
      drive: true,
      record: push,
    },
    {
      from: brakeCatch,
      to: brakeRelease,
      recovery: brake.recovery,
      drive: false,
      record: stop,
    },
  ];
  for (const { from, to, recovery, drive, record } of phases) {
    const named: readonly IAutoMovieMotionHumanContactWindow[] =
      record.plan.contacts.filter(({ kind }): boolean => kind === "grip");
    check(
      named.length === (drive ? 2 : 1) &&
        named.every(
          ({ part: hand, from: first, to: last, support }): boolean =>
            (hand === "leftHand" || (drive && hand === "rightHand")) &&
            support.kind === "prop" &&
            support.subject === "chair" &&
            nclose(record.start + first * record.plan.duration, from, 1e-9) &&
            nclose(record.start + last * record.plan.duration, to, 1e-9),
        ),
      drive
        ? "both hands own the push grip window"
        : "only the inside hand owns the braking grip window",
    );
    for (const share of [0, 0.25, 0.5, 0.75, 1]) {
      const time: number = from + (to - from) * share;
      const sampled: ReturnType<typeof ride.at> = ride.at(time);
      const frame: IAutoMovieRigidTransform = performance.prop("chair", time);
      const bones: ReturnType<HumanPerformance["bones"]> = performance.bones(
        "rider",
        time,
      );
      const elapsed: number = time - departure;
      const turning: number = time - brakeCatch;
      const braking: number = Math.max(
        0,
        turning - turnSeconds + arrivalBraking,
      );
      const progress: number = drive
        ? 0.5 * acceleration * elapsed ** 2
        : straight + cruise * turning - 0.5 * deceleration * braking ** 2;
      const arc: number = drive ? 0 : (progress - straight) / radius;
      const floorReady: boolean = [
        "wheel-left",
        "wheel-right",
        "caster-left",
        "caster-right",
      ].every((wheelPart: string): boolean =>
        nclose(
          wheelBottom(sampled.archetype.parts, wheelPart, frame),
          0,
          FLOOR_GAP,
        ),
      );
      check(
        floorReady,
        "displayed wheel and caster cylinders rest on the floor at " + time,
      );
      check(
        vclose(local(frame, pelvis(body, bones)), neutralSeat, SUPPORT_GAP),
        "pelvis remains seated while the chair moves at " + time,
      );
      if (drive) {
        check(
          vclose(
            frame.position,
            world(origin, { x: 0, y: 0, z: progress }),
            1e-6,
          ),
          "accelerating path agrees with the displacement law at " + time,
        );
      } else {
        check(
          vclose(world(frame, innerLocal), inner, 1e-6),
          "inside axle end stays fixed in world space at " + time,
        );
      }
      for (const side of SIDES) {
        const spin: number = sampled.archetype.travel(`${side}Spin`);
        const signed: number = (side === "left" ? -1 : 1) * radius * arc;
        const expectedSpin: number =
          (progress + signed) / wheel / Quaternion.DEG2RAD;
        check(
          nclose(spin, expectedSpin, 1e-6),
          side + " wheel advances its own path at " + time,
        );
        const wrist: IAutoMovieVector3 = local(
          frame,
          bones.get(`${side}Hand`)!.worldPosition,
        );
        const neutral: IAutoMovieVector3 = local(
          origin,
          restBones.get(`${side}Hand`)!.worldPosition,
        );
        if (!drive && side === "right") {
          check(
            vclose(wrist, neutral, SUPPORT_GAP),
            "the free wrist is carried during the pivot at " + time,
          );
          continue;
        }
        const rim: ReturnType<typeof chair.affordance> = chair.affordance(
          `${side}Rim`,
        );
        const handAngle: number = drive
          ? -15 * Quaternion.DEG2RAD + (progress - progressAtCatch) / wheel
          : 12 * Quaternion.DEG2RAD;
        const fromAxle: number = rim.radius! + 0.075 * body.measure.hand;
        const grip: IAutoMovieVector3 = Vector3.add(rim.frame.translation, {
          x: (side === "left" ? 1 : -1) * 0.35 * body.measure.hand,
          y: fromAxle * Math.cos(handAngle),
          z: fromAxle * Math.sin(handAngle),
        });
        check(
          vclose(wrist, grip, SUPPORT_GAP),
          side +
            " wrist reaches the independently advanced rim at " +
            time +
            " with gap " +
            Vector3.distance(wrist, grip),
        );
      }
    }
    const bound: number = to + recovery * 0.5;
    const wrist = (film: number): IAutoMovieVector3 =>
      local(
        performance.prop("chair", film),
        performance.bones("rider", film).get("leftHand")!.worldPosition,
      );
    const middle: IAutoMovieVector3 = wrist(bound);
    const terminal: IAutoMovieVector3 = wrist(record.end);
    check(
      Vector3.distance(middle, wrist(to)) >= 0.15 * body.measure.hand &&
        vclose(
          terminal,
          local(origin, restBones.get("leftHand")!.worldPosition),
          SUPPORT_GAP,
        ) &&
        vclose(wrist(bound), middle, 1e-9),
      "released wrist leaves the material point and returns reproducibly through recovery at " +
        to,
    );
    check(
      vclose(wrist(to - 1e-4), wrist(to + 1e-4), FLOOR_GAP),
      "wrist crosses the release boundary without a positional jump at " + to,
    );
    for (const boundary of [from, to]) {
      const at: IAutoMovieVector3 = wrist(boundary);
      const gap = (seconds: number): number =>
        Vector3.distance(
          Vector3.subtract(at, wrist(boundary - seconds)),
          Vector3.subtract(wrist(boundary + seconds), at),
        ) / seconds;
      const coarse: number = gap(0.002);
      const fine: number = gap(0.001);
      check(
        fine <= 0.75 * coarse + 1e-6,
        `wrist velocity at ${boundary} converges from ${coarse} to ${fine} m/s`,
      );
    }
  }

  assert.throws(
    () =>
      rideWheelchair.handrimContacts(ride, [
        holds[0]!,
        { ...holds[0]!, side: "left", degrees: 30 },
      ]),
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === "handrims",
  );
  const separate: ReturnType<typeof rideWheelchair.handrimContacts> =
    rideWheelchair.handrimContacts(ride, [
      { ...holds[0]!, side: "right", degrees: 15 },
      { ...holds[0]!, side: "left" },
    ]);
  const independent: ReturnType<typeof wheelchairHandrimFrame> =
    wheelchairHandrimFrame(ride, initialCatch, 15);
  check(
    vclose(
      separate("leftRim", initialCatch).translation,
      part("leftRim", initialCatch).translation,
      1e-9,
    ) &&
      vclose(
        separate("rightRim", initialCatch).translation,
        independent("rightRim", initialCatch).translation,
        1e-9,
      ),
    "different hands can choose separate material points at a common time",
  );
  TestValidator.equals("wheelchair travel, contact and recovery", checks, []);
}

/** Measure the lowest point in metres of a posed wheel cylinder. */
function wheelBottom(
  parts: readonly IAutoMovieModelPart[],
  name: string,
  frame: IAutoMovieRigidTransform,
): number {
  const wheel: IAutoMovieModelPart | undefined = parts.find(
    ({ id }): boolean => id === name,
  );
  if (
    wheel?.geometry.type !== "primitive" ||
    wheel.geometry.shape.type !== "cylinder" ||
    wheel.transform === null
  )
    throw new Error("Missing posed wheel cylinder " + name);
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, wheel.transform.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const centre: IAutoMovieVector3 = world(frame, wheel.transform.translation);
  // Projection of a finite cylinder onto world up.
  return (
    centre.y -
    (Math.abs(axis.y) * wheel.geometry.shape.height) / 2 -
    Math.hypot(axis.x, axis.z) * wheel.geometry.shape.radius
  );
}

/** Convert metres to the relevant chair frame. */
function local(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** Put a point on the chair into world metres. */
function world(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, point),
  );
}

/** Place the actual seat surface region on the displayed pelvis bone. */
function pelvis(
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<HumanPerformance["bones"]>,
): IAutoMovieVector3 {
  const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"]["seat"] =
    body.surfaces.regions.seat;
  return resolveAutoMovieHumanoidSurfaces.place(
    surface,
    bones.get(surface.bone)!,
  ).point;
}
