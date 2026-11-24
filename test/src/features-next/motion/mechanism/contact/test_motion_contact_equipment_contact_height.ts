import {
  createBench,
  createExerciseBike,
  createExerciseMat,
  createKerb,
  createLadder,
  createParallelBars,
  createPlyoBox,
  createPullUpBar,
  createRowingMachine,
  createSled,
  createTap,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanSportCarry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * Independently placed equipment defines the heights of its supported body parts.
 * Scenarios:
 * - Bench, box, kerb, step and bars are read in their own placed frames at the support events.
 * - A hanging body grips a real bar; missing support is refused. Climbing three rungs raises both ankles without carrying the ladder.
 * - A quarter turn of the tap reaches its placed lever.
 * @evidence contracts/development/testing.md#behavioral-verification Each contact is independently measured from displayed joints or grip sockets and the archetype's own placed affordance.
 * @evidence contracts/development/testing.md#independent-expectations A foot over a platform is within 150 mm of its top, a fist pair within 15 mm of its support, and ankle rise equals three physical rung spacings within 50 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Hand, pelvis and foot support change the measured anatomy. Loose fixtures and absent affordances are refused.
 * @evidence contracts/development/testing.md#execution-ownership One body, each participating equipment action staged independently. Both limbs are read from the same pose.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the contact, event and physical reference for each measurement.
 */
export function test_motion_contact_equipment_contact_height(): void {
  const body = motionHumanBody("m-average"),
    actor = HumanChain.subject("a"),
    findings: string[] = [];
  const stage = (
    model: IAutoMovieMotionHumanObject.IModel,
    placement: IAutoMovieMotionHumanObject.Placement,
    chain: IAutoMovieMotionHumanChain,
    laws: IAutoMovieMotionHumanActionLaw<never>[] = [],
  ) =>
    new HumanPerformance({
      seed: "equipment",
      laws,
      props: [HumanObject.prop("fixture", model, placement)],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const bench = createBench({}),
    bar = createPullUpBar({ kind: "gym" }),
    station = createParallelBars({ kind: "dipStation" }),
    box = createPlyoBox({ height: 0.508 });
  const nominal = (
    model: IAutoMovieMotionHumanObject.IModel,
    id: string,
    p: IAutoMovieMotionHumanObject.Placement,
  ) => {
    const frame = HumanObject.frame(p),
      local = (model.affordances ?? []).find((a) => a.id === id)!.frame
        .translation;
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  };
  const tests = [
    [
      bench,
      "surface",
      1.2,
      AutoMovieMotionHumanWorkout.HumanSportWorkout.benchPress,
    ],
    [bar, "bar", 0.3, AutoMovieMotionHumanWorkout.HumanSportWorkout.pullUp],
    [station, "barLeft", -1.2, AutoMovieMotionHumanWorkout.HumanSportGym.dip],
    [box, "surface", -1.2, AutoMovieMotionHumanWorkout.HumanSportGym.stepUp],
    [
      bench,
      "surface",
      1.2,
      AutoMovieMotionHumanWorkout.HumanSportGym.inclinePushUp,
    ],
    [
      bench,
      "surface",
      1.2,
      AutoMovieMotionHumanWorkout.HumanSportGym.declinePushUp,
    ],
    [
      box,
      "surface",
      -1.2,
      AutoMovieMotionHumanThrowCatch.HumanSportThrow.boxJump,
    ],
    [
      createKerb({ kind: "kerb" }),
      "top",
      1.2,
      AutoMovieMotionHumanWorkout.HumanSportGym.stepUp,
    ],
    [
      createKerb({ kind: "step" }),
      "top",
      -1.2,
      AutoMovieMotionHumanWorkout.HumanSportGym.stepUp,
    ],
  ] as const;
  for (const [model, affordance, z, law] of tests) {
    const p = { at: { x: 0, y: 0, z }, yaw: 0 },
      target = nominal(model, affordance, p);
    const params =
      law.name === "boxJump"
        ? { on: "fixture", to: target, apex: 0.7 }
        : {
            reps: 1,
            on: {
              prop: "fixture",
              affordance,
              ...(law.name === "dip" ? { other: "barRight" } : {}),
            },
          };
    const film = stage(
        model,
        p,
        actor.stand({ hold: 0.3 }).registered(law.name, params),
        [law],
      ),
      span = film.segments("a")[1]!;
    const event = (name: string) =>
      span.start +
      span.plan.events.find((e) => e.name === name)!.share * span.plan.duration;
    const at = (bone: AutoMovieHumanoidBone, t: number) =>
      film.bones("a", t).get(bone)!.worldPosition;
    const check = (ok: boolean, label: string) => {
      if (!ok) findings.push(law.name + " " + label);
    };
    if (law.name === "benchPress") {
      const t = event("lockout1"),
        hip = Vector3.lerp(at("leftUpperLeg", t), at("rightUpperLeg", t), 0.5);
      check(
        hip.y > target.y &&
          hip.y - target.y < 0.2 * body.measure.stature &&
          Math.hypot(hip.x - target.x, hip.z - target.z) <= 0.3,
        "pelvis on bench",
      );
    } else if (law.name === "stepUp" || law.name === "boxJump") {
      for (const foot of (law.name === "stepUp"
        ? ["rightFoot"]
        : ["leftFoot", "rightFoot"]) as readonly AutoMovieHumanoidBone[]) {
        const ankle = at(
          foot,
          event(law.name === "stepUp" ? "up1" : "settled"),
        );
        const horizontal =
          law.name === "boxJump"
            ? Math.max(
                Math.abs(ankle.x - target.x),
                Math.abs(ankle.z - target.z),
              )
            : Math.hypot(ankle.x - target.x, ankle.z - target.z);
        check(
          ankle.y >= target.y &&
            ankle.y - target.y <= 0.15 &&
            horizontal <= (law.name === "boxJump" ? 0.3 : 0.4),
          "ankle over platform",
        );
      }
      if (law.name === "stepUp")
        check(
          Math.abs(at("leftFoot", event("down1")).y - at("leftFoot", 0).y) <=
            0.03,
          "return to floor",
        );
    } else if (law.name === "pullUp" || law.name === "dip") {
      const centre =
        law.name === "dip"
          ? Vector3.lerp(target, nominal(model, "barRight", p), 0.5)
          : target;
      for (const name of law.name === "dip"
        ? ["top1", "bottom1"]
        : ["hang1", "top1"]) {
        const bones = film.bones("a", event(name)),
          points = [
            body.surfaces.sockets.gripLeft,
            body.surfaces.sockets.gripRight,
          ].map(
            (socket) =>
              resolveAutoMovieHumanoidSurfaces.place(
                socket,
                bones.get(socket.bone)!,
              ).point,
          );
        check(
          Vector3.distance(Vector3.lerp(points[0]!, points[1]!, 0.5), centre) <=
            0.015,
          "grip midpoint at " + name,
        );
      }
      if (law.name === "pullUp") {
        const t = (span.start + span.end) / 2,
          bones = film.bones("a", t);
        for (const socket of [
          body.surfaces.sockets.gripLeft,
          body.surfaces.sockets.gripRight,
        ]) {
          const grip = resolveAutoMovieHumanoidSurfaces.place(
            socket,
            bones.get(socket.bone)!,
          ).point;
          check(
            Math.hypot(grip.y - centre.y, grip.z - centre.z) <= 0.05,
            "grip lies on bar axis",
          );
        }
        for (const side of ["left", "right"] as const)
          check(
            at(`${side}Foot`, t).y > body.measure.ankleHeight + 0.05,
            "suspended feet",
          );
        let e: unknown;
        try {
          stage(model, p, actor.registered(law.name, { count: 1 }), [law]);
        } catch (error) {
          e = error;
        }
        check(
          e instanceof HumanRefusal && e.axis === "on",
          "missing bar refusal",
        );
      }
    } else {
      const t = event("top1"),
        incline = law.name === "inclinePushUp";
      const wrists =
        (at("leftHand", t).y + at("rightHand", t).y) / 2 -
        (incline ? target.y : 0);
      const toes =
        (at("leftToes", t).y + at("rightToes", t).y) / 2 -
        (incline ? 0 : target.y);
      check(
        wrists >= 0 && wrists <= 0.08 && toes >= 0 && toes <= 0.06,
        "inclined support heights",
      );
    }
  }
  const ladder = createLadder({ kind: "fixed", spacing: 0.3 }),
    pose = { at: { x: 0, y: 0, z: 0.35 }, yaw: 180 };
  const climb = (fixed: boolean) =>
    stage(
      ladder,
      { ...pose, fixed },
      actor.climbLadder({ ladder: "fixture", rungs: 3 }),
    );
  const trip = climb(true);
  for (let t = 0; t <= trip.duration; t += 0.1)
    if (Vector3.distance(trip.prop("fixture", t).position, pose.at) > 0.001)
      findings.push("Climb displaced the fixed ladder.");
  for (const side of ["left", "right"] as const) {
    const y = (t: number) =>
      trip.bones("a", t).get(`${side}Foot`)!.worldPosition.y;
    if (Math.abs(y(trip.duration) - y(0) - 3 * 0.3) > 0.05)
      findings.push("Ankle rise differs from three rung spacings.");
  }
  let loose: unknown;
  try {
    climb(false);
  } catch (e) {
    loose = e;
  }
  if (!(loose instanceof HumanRefusal))
    findings.push("Loose ladder should be refused.");
  for (const [model, law, contact, event, x, z] of [
    [
      createRowingMachine(),
      AutoMovieMotionHumanWorkout.HumanSportWorkout.rowing,
      "seat",
      "catch1",
      1.5,
      0,
    ],
    [
      createExerciseBike(),
      AutoMovieMotionHumanWorkout.HumanSportWorkout.cycling,
      "saddle",
      "leftBottom1",
      -1.5,
      0,
    ],
    [
      createExerciseMat({ kind: "gym" }),
      AutoMovieMotionHumanWorkout.HumanSportWorkout.sitUp,
      "surface",
      "down1",
      0,
      -1.5,
    ],
  ] as const) {
    const placement = { at: { x, y: 0, z }, yaw: 0 };
    const support = nominal(model, contact, placement);
    const film = stage(
      model,
      placement,
      actor.registered(law.name, {
        count: 1,
        on: { prop: "fixture", affordance: contact },
      }),
      [law],
    );
    const segment = film.segments("a")[0]!;
    const t =
      segment.plan.events.find((e) => e.name === event)!.share *
      segment.plan.duration;
    const bones = film.bones("a", t);
    const hip = Vector3.lerp(
      bones.get("leftUpperLeg")!.worldPosition,
      bones.get("rightUpperLeg")!.worldPosition,
      0.5,
    );
    const height = hip.y - support.y;
    if (
      !(
        height >= 0 &&
        height <= body.measure.stature / 5 &&
        Math.hypot(hip.x - support.x, hip.z - support.z) <= 0.3
      )
    )
      findings.push(law.name + " pelvis misses its support.");
  }
  const sled = createSled(),
    start = { x: 0, y: 0, z: 0.6 };
  const push = stage(
    sled,
    { at: start, yaw: 0 },
    actor.registered("sledPush", { sled: "fixture", to: { x: 0, y: 0, z: 4 } }),
    [HumanSportCarry.sledPush],
  );
  const span = push.segments("a")[0]!;
  const grip =
    span.plan.events.find((e) => e.name === "gripped")!.share *
    span.plan.duration;
  if (push.prop("fixture", push.duration).position.z - start.z < 2)
    findings.push("Sled advances less than two metres.");
  for (let t = grip + 0.05; t <= push.duration; t += 0.25) {
    const frame = push.prop("fixture", t),
      bones = push.bones("a", t);
    for (const side of ["left", "right"] as const) {
      const socket =
        body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
      const fist = resolveAutoMovieHumanoidSurfaces.place(
        socket,
        bones.get(socket.bone)!,
      ).point;
      const handle = sled.affordance(side);
      const half = (handle.length ?? 0) / 2;
      const axis = Quaternion.rotateVector(
        Quaternion.multiply(frame.rotation, handle.frame.rotation),
        { x: 1, y: 0, z: 0 },
      );
      const center = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, handle.frame.translation),
      );
      const offset = Vector3.subtract(fist, center);
      const projected = Math.max(
        -half,
        Math.min(half, Vector3.dot(offset, axis)),
      );
      if (Vector3.distance(offset, Vector3.scale(axis, projected)) > 0.01)
        findings.push(side + " grip left its handle at " + t + "s");
    }
  }
  const tap = createTap(),
    tp = {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: 0.9,
        z: 0.45 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 180,
    };
  const control = stage(
    tap,
    tp,
    actor.stand({ hold: 0.3 }).registered("operate", {
      kind: {
        kind: "knob",
        at: { kind: "prop", subject: "fixture", point: "lever" },
        turn: 90,
      },
    }),
  );
  const act = control.segments("a")[1]!,
    ready =
      act.start +
      act.plan.events.find((e) => e.name === "ready")!.share *
        act.plan.duration;
  if (
    Vector3.distance(
      control.bones("a", ready).get("rightHand")!.worldPosition,
      nominal(tap, "lever", tp),
    ) >
    1.2 * body.measure.hand
  )
    findings.push("The tap wrist falls outside the hand's lever reach.");
  TestValidator.equals("equipment support and fixture contacts", findings, []);
}
