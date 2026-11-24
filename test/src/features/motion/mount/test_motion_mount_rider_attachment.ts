import {
  createBicycle,
  createCar,
  createHorse,
  rideBicycle,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A seated rider inherits rigid support motion. A rising rider moves relative
 * to the saddle, in time with its stride.
 *
 * Scenarios:
 *
 * - A turning seat carries a sitter with a free hand at constant seat offset and
 *   heading; boarding from standing is refused.
 * - At two consecutive forefoot landings the rider returns to the saddle. Between
 *   them the pelvis lifts and both feet remain on their stirrups.
 * - Removing the stirrups refuses the rising action.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads public prop transforms, the displayed seat region and foot balls, plus typed admission results.
 * @evidence contracts/development/testing.md#independent-expectations Compares pose against independently sampled prop frames. Campaign bounds are 10 mm support drift, one degree heading, 15 mm return and a tenth of the thigh for a visible rise.
 * @evidence contracts/development/testing.md#distinguishing-cases A rigid rotating seat and a periodic moving saddle distinguish a carried offset from a stride-locked relative movement.
 * @evidence contracts/development/testing.md#execution-ownership One occupied ride per kind of support and the two invalid entries.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the geometry, clocks and bounds.
 */
export function test_motion_mount_rider_attachment(): void {
  const findings: string[] = [];
  checkGripAndLanding(findings);
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
  // The seat is the car's, which starts moving while the driver still sits
  // down: the sit follows it (`HumanObject.seat`'s carrier).
  const seat = HumanObject.seat(car, placed(0), "driverSeat", "car");
  const drive = (chain: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "attached",
      laws: [AutoMovieMotionHumanMount.rideHorse.ride],
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
      .registered("ride", { on: "car", duration: 7 })
      .over((part) => part.handToFace({ kind: "phone" })),
  );
  const segment = carFilm.segments("a")[1]!,
    reader = HumanSignature(carFilm, "a", driver, 0);
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
      actor.stand({ hold: 0.5 }).registered("ride", { on: "car", duration: 2 }),
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
      laws: [AutoMovieMotionHumanMount.rideHorse.ride],
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
      composition: actor.sit({ seat: target, hold: 0.5 }).registered("ride", {
        on: "horse",
        duration: wait + gait.duration,
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
    sample = HumanSignature(ride, "a", body, 0);
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

interface IAttachment {
  label: string;
  name: motionHumanBody.Name;
  model: IAutoMovieMotionHumanObject.IModel;
  duration: number;
  at: (t: number) => IAutoMovieTransform;
  part: (id: string, t: number) => IAutoMovieTransform;
  holds: Record<AutoMovieHumanSide, string>;
  ride: Pick<IAutoMovieMotionHumanRide.IParams, "feet" | "seat">;
}
function checkGripAndLanding(findings: string[]): void {
  const WAIT: number = 6;
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({});
  const horse: ReturnType<typeof createHorse> = createHorse({});
  const cycling: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 8 },
      { kind: "turn", radius: 8, angle: 90 },
    ],
    cruise: 4,
    acceleration: 1.5,
    deceleration: 2,
  });
  const trotting: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 10 }],
      cruise: 3.5,
      acceleration: 1.5,
      deceleration: 1.5,
    },
    "trot",
  );
  const rides: readonly IAttachment[] = [
    {
      label: "the bicycle's grips",
      name: "m-average",
      model: bicycle,
      duration: cycling.duration,
      at: (seconds: number): IAutoMovieTransform =>
        cycling.at(seconds).placement,
      part: (id: string, seconds: number): IAutoMovieTransform =>
        cycling.frame(id as Parameters<typeof cycling.frame>[0], seconds),
      holds: { left: "leftGrip", right: "rightGrip" },
      ride: { feet: { left: "leftPedal", right: "rightPedal" } },
    },
    {
      label: "the horse's reins",
      name: "f-small",
      model: horse,
      duration: trotting.duration,
      at: (seconds: number): IAutoMovieTransform =>
        trotting.at(seconds).placement,
      part: (id: string, seconds: number): IAutoMovieTransform =>
        trotting.frame(id as Parameters<typeof trotting.frame>[0], seconds),
      holds: { left: "leftRein", right: "rightRein" },
      ride: {
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
      },
    },
  ];
  for (const m of rides) {
    const body = motionHumanBody(m.name);
    const place = (t: number) => {
      const p = m.at(Math.max(0, t - WAIT));
      return { position: p.translation, rotation: p.rotation };
    };
    const part = (id: string, t: number) => m.part(id, Math.max(0, t - WAIT));
    const seat = HumanObject.seat(m.model, place(0));
    const actor = HumanChain.subject("a");
    const perform = (x: number, chain: IAutoMovieMotionHumanChain) =>
      new HumanPerformance({
        seed: "mounts",
        laws: [AutoMovieMotionHumanMount.rideHorse.ride],
        props: [HumanObject.prop("mount", m.model, place(0), place, part)],
        performers: [
          {
            subject: "a",
            body,
            at: HumanFrame.point(
              { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
              { x, y: 0, z: -0.2 },
            ),
            yaw: seat.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    const sit = actor.sit({ seat, hold: 0.5 });
    const params = { on: "mount", duration: WAIT + m.duration, ...m.ride };
    if (m.ride.seat) {
      let error: unknown;
      try {
        perform(-0.6, sit);
      } catch (caught) {
        error = caught;
      }
      if (
        !(
          error instanceof HumanRefusal &&
          error.kind === "base" &&
          error.axis === "seat" &&
          error.feasible?.kind === "alternatives" &&
          error.feasible.values.includes("left")
        )
      )
        findings.push(
          "The mount must refuse a right-side entry and offer the left.",
        );
    }
    const held = perform(
      0.6,
      sit
        .registered("ride", { ...params, hands: m.holds })
        .rise({ to: "left" }),
    );
    const reader = HumanSignature(held, "a", body, 0),
      span = held.segments("a")[1]!;
    // With the hands on the handlebars the torso reaches forward. Measure
    // passive carriage on the unoccupied upper body and grip geometry on the held ride.
    const passive = perform(
      0.6,
      sit.registered("ride", params).rise({ to: "left" }),
    );
    const seatedReader = HumanSignature(passive, "a", body, 0);
    const saddleAt = (t: number) => {
      if (!m.ride.seat) return place(t);
      const f = part(m.ride.seat, t);
      return { position: f.translation, rotation: f.rotation };
    };
    const local = (
      p: ReturnType<typeof HumanSignature.region>,
      frame: IAutoMovieRigidTransform,
    ) =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(p, frame.position),
      );
    const from = span.entryTime + 0.3,
      to = span.end - 0.05;
    let bank = 0,
      low = Infinity,
      high = -Infinity;
    for (const region of ["seat", "sternum"] as const) {
      const first = local(
        HumanSignature.region(seatedReader, region, from),
        saddleAt(from),
      );
      for (let k = 0; k <= 8; k++) {
        const t = from + ((to - from) * k) / 8,
          saddle = saddleAt(t);
        const relative = local(
          HumanSignature.region(seatedReader, region, t),
          saddle,
        );
        if (Vector3.distance(relative, first) > 0.01)
          findings.push(
            m.label + " " + region + " moves relative to its saddle at " + t,
          );
        high = Math.max(high, saddle.position.y);
        low = Math.min(low, saddle.position.y);
        const up = Quaternion.rotateVector(place(t).rotation, {
          x: 0,
          y: 1,
          z: 0,
        });
        bank = Math.max(
          bank,
          (Math.acos(Math.min(1, Math.max(-1, up.y))) * 180) / Math.PI,
        );
      }
    }
    if (m.ride.seat ? high - low < 0.02 : bank < 8)
      findings.push(m.label + " failed to produce saddle motion.");
    for (const side of ["left", "right"] as const) {
      const grip = m.holds[side],
        start = WAIT + 0.3 * m.duration;
      const relative = (t: number) =>
        local(HumanSignature.joint(reader, t, `${side}Hand`), {
          position: part(grip, t).translation,
          rotation: place(t).rotation,
        });
      const first = relative(start);
      for (let k = 0; k <= 6; k++) {
        const t = WAIT + (0.3 + 0.1 * k) * m.duration,
          p = relative(t);
        if (
          Vector3.length(p) > 0.7 * body.measure.hand ||
          Vector3.distance(first, p) > 0.01
        )
          findings.push(m.label + " " + side + " wrist lost its grip at " + t);
      }
      const t = WAIT + 0.6 * m.duration,
        wrist = HumanSignature.joint(reader, t, `${side}Hand`),
        knuckle = HumanSignature.joint(reader, t, `${side}MiddleProximal`),
        tip = HumanSignature.joint(reader, t, `${side}MiddleDistal`);
      if (
        Vector3.distance(wrist, tip) >= Vector3.distance(wrist, knuckle) ||
        Vector3.distance(knuckle, part(grip, t).translation) >
          0.5 * body.measure.hand
      )
        findings.push(
          m.label + " " + side + " finger did not close on the grip",
        );
      if (!HumanSignature.bears(reader, held.segments("a")[2]!.end, side))
        findings.push(m.label + " failed to dismount on both feet.");
    }
    const free = perform(
      0.6,
      sit.registered("ride", params).over((p) => p.gesture({ kind: "wave" })),
    );
    if (free.overlays("a").length !== 1)
      findings.push("A free arm could not wave during the ride.");
  }
}
