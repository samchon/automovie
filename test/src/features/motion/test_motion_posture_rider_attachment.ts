import { createCar, createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seated rider inherits rigid support motion. A rising rider moves relative to the saddle, in time with its stride.
 *
 * Scenarios:
 * - A turning seat carries a sitter with a free hand at constant seat offset and heading; boarding from standing is refused.
 * - At two consecutive forefoot landings the rider returns to the saddle. Between them the pelvis lifts and both feet remain on their stirrups.
 * - Removing the stirrups refuses the rising action.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public prop transforms, the displayed seat region and foot balls, plus typed admission results.
 * @evidence contracts/development/testing.md#independent-expectations Compares pose against independently sampled prop frames. Campaign bounds are 10 mm support drift, one degree heading, 15 mm return and a tenth of the thigh for a visible rise.
 * @evidence contracts/development/testing.md#distinguishing-cases A rigid rotating seat and a periodic moving saddle distinguish a carried offset from a stride-locked relative movement.
 * @evidence contracts/development/testing.md#execution-ownership One occupied ride per kind of support and the two invalid entries.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the geometry, clocks and bounds.
 */
export function test_motion_posture_rider_attachment(): void {
  const findings: string[] = [];
  const driver = motionHumanBody("m-average"),
    car = createCar({ kind: "sedan" });
  const travel = 4;
  const placed = (t: number): IAutoMovieRigidTransform => {
    const phase = Math.min(1, Math.max(0, (t - 3) / travel));
    return {
      position: { x: 0, y: 0, z: phase },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90 * phase),
    };
  };
  const seat = HumanObject.seat(car, placed(0), "driverSeat");
  const drive = (chain: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "attached",
      laws: [HumanRide.ride],
      props: [HumanObject.prop("car", car, placed(0), placed)],
      performers: [
        {
          subject: "a",
          body: driver,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            { x: 0, y: 0, z: 0.2 },
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const actor = HumanChain.subject("a");
  const carFilm = drive(
    actor
      .sit({ seat })
      .registered("ride", { on: "car", seconds: 7 })
      .over((part) => part.handToFace({ task: "phone" })),
  );
  const segment = carFilm.segments("a")[1]!,
    reader = HumanSignature.of(carFilm, "a", driver, 0);
  const offset = (t: number) =>
    Vector3.distance(
      HumanSignature.region(reader, "seat", t),
      HumanObject.seat(car, placed(t), "driverSeat").at,
    );
  if (
    Math.abs(
      HumanObject.seat(car, placed(segment.end), "driverSeat").yaw - seat.yaw,
    ) <= 80
  )
    findings.push(
      "The driven seat never turns through the required quarter turn.",
    );
  const initial = offset(segment.entryTime);
  for (let i = 0; i <= 8; i++) {
    const t = segment.entryTime + (i * (segment.end - segment.entryTime)) / 8;
    const yaw = HumanObject.seat(car, placed(t), "driverSeat").yaw;
    if (
      Math.abs(offset(t) - initial) > 0.01 ||
      Math.abs(((carFilm.posture("a", t).yaw - yaw + 540) % 360) - 180) > 1
    )
      findings.push("Rotating seat drift at " + t);
  }
  let bad: unknown;
  try {
    drive(
      actor
        .stand({ seconds: 0.5 })
        .registered("ride", { on: "car", seconds: 2 }),
    );
  } catch (error) {
    bad = error;
  }
  if (
    !(
      bad instanceof HumanRefusal &&
      bad.kind === "base" &&
      bad.feasible?.kind === "alternatives" &&
      bad.feasible.values.includes("sit")
    )
  )
    findings.push("Standing ride did not offer sitting.");

  const body = driver,
    horse = createHorse({}),
    wait = 6;
  const gait = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 6 }],
      cruise: 3.5,
      acceleration: 1.5,
      deceleration: 1.5,
    },
    "trot",
  );
  const placement = (t: number) => {
    const p = gait.at(Math.max(0, t - wait)).placement;
    return { position: p.translation, rotation: p.rotation };
  };
  const part = (id: string, t: number) =>
    gait.frame(id as Parameters<typeof gait.frame>[0], Math.max(0, t - wait));
  const cues = gait.instants
    .filter((e) => e.label === "leftForeOn")
    .map((e) => ({ name: e.label, seconds: wait + e.seconds }));
  const saddle = HumanObject.seat(horse, placement(0));
  const mount = (target: IAutoMovieMotionHumanSeated.ISeat) =>
    new HumanPerformance({
      seed: "rising",
      laws: [HumanRide.ride],
      cues: { strides: cues },
      props: [HumanObject.prop("horse", horse, placement(0), placement, part)],
      performers: [
        {
          subject: "a",
          body,
          at: HumanFrame.point(
            { origin: { ...target.at, y: 0 }, yaw: target.yaw },
            { x: 0.6, y: 0, z: -0.2 },
          ),
          yaw: target.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: actor
        .sit({ seat: target, seconds: 0.5 })
        .registered("ride", {
          on: "horse",
          seconds: wait + gait.duration,
          rising: { cue: "strides" },
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
        }).node,
    });
  const { footrests: _rests, ...bare } = saddle;
  bad = undefined;
  try {
    mount(bare);
  } catch (error) {
    bad = error;
  }
  if (
    !(
      bad instanceof HumanRefusal &&
      bad.kind === "affordance" &&
      bad.axis === "rising"
    )
  )
    findings.push("Rising requires stirrups.");
  const ride = mount(saddle),
    span = ride.segments("a")[1]!,
    sample = HumanSignature.of(ride, "a", body, 0);
  const inside = cues.filter(
    (c) => c.seconds >= span.entryTime + 0.3 && c.seconds <= span.end - 0.3,
  );
  if (inside.length < 2)
    throw new Error("Two actual in-ride landings required.");
  const i = Math.floor((inside.length - 1) / 2),
    from = inside[i]!.seconds,
    to = inside[i + 1]!.seconds;
  const local = (
    point: ReturnType<typeof HumanSignature.region>,
    id: string,
    t: number,
  ) =>
    Quaternion.rotateVector(
      Quaternion.inverse(placement(t).rotation),
      Vector3.subtract(point, part(id, t).translation),
    );
  const hip = (t: number) =>
    local(HumanSignature.region(sample, "seat", t), "seat", t);
  const ball = (side: AutoMovieHumanSide, t: number) =>
    local(
      HumanFoot.sockets(body, HumanSignature.bones(sample, t), side).find(
        (s) => s.socket === "ball",
      )!.point,
      side + "Stirrup",
      t,
    );
  const start = hip(from);
  let rise = 0;
  for (let j = 0; j <= 8; j++) {
    const t = from + ((to - from) * j) / 8;
    rise = Math.max(rise, hip(t).y - start.y);
    for (const side of ["left", "right"] as const)
      if (Vector3.distance(ball(side, from), ball(side, t)) > 0.01)
        findings.push(side + " stirrup drift at " + t);
  }
  if (
    rise < 0.1 * body.measure.thigh ||
    Vector3.distance(hip(to), start) > 0.015
  )
    findings.push("Pelvis failed to lift and return over one actual stride.");
  TestValidator.equals("rider attachment", findings, []);
}
