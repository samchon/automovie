import {
  createBarbell,
  createBench,
  createDumbbell,
  createKettlebell,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwing,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * The second hand meets a bar's other grip when a held bar is levelled.
 *
 * Scenarios:
 * 1. Align the bar with the held right hand and apply the two-hand load to one posture.
 * 2. The projected hand separation follows the physical handle spacing. A one-hand load leaves the unoccupied arm untouched.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the grasp, the two independent handle landmarks and the one-hand control.
 * @evidence contracts/development/testing.md#behavioral-verification Supplies the physical bar and its measured holding grip at entry, applies the public load writer and measures the resolved hand positions.
 * @evidence contracts/development/testing.md#independent-expectations The bar model supplies the grip span. The wrist allowance is the original loaded exercise's 0.12 m per hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A one-handle and a two-handle constraint operate on the same held bar.
 * @evidence contracts/development/testing.md#execution-ownership An authored standing grip prepares the frame for the isolated loaded posture.
 */
export function test_motion_posture_equipment_kinematics(): void {
  const bar: ReturnType<typeof createBarbell> = createBarbell({
    kind: "mens",
    grip: 0.5,
    load: 0,
  });

  const body = motionHumanBody("f-small");
  const performer = {
    subject: "a",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" as const },
  };
  const stand = HumanChain.subject("a").stand({ hold: 0.3, sway: 0 }).node;
  const event = (part: IAutoMovieMotionHumanSegment, key: string): number =>
    part.start +
    part.plan.events.find((e) => e.name === key)!.share * part.plan.duration;
  const bench = createBench({});
  const rotation = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -Math.PI / 2);
  const benchAt = { x: 0, y: 0, z: -0.6 };
  const edge = Vector3.add(
    benchAt,
    Quaternion.rotateVector(
      rotation,
      bench.affordance("edge").frame.translation,
    ),
  );
  const hip = new HumanPerformance({
    seed: "hip-thrust",
    performers: [performer],
    laws: [AutoMovieMotionHumanWorkout.HumanSportGym.hipThrust],
    props: [HumanObject.prop("bench", bench, { position: benchAt, rotation })],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .registered("hipThrust", {
        count: 1,
        on: { prop: "bench", affordance: "edge" },
      }).node,
  });
  const lift = hip.segments("a")[1]!,
    bottom = event(lift, "down1"),
    top = event(lift, "lockout1");
  const stature = body.measure.stature;
  for (const t of [bottom, top]) {
    const bones = hip.bones("a", t),
      chest = bones.get("chest")!.worldPosition;
    TestValidator.predicate(
      "bench supports the thorax at both extremes",
      chest.y >= edge.y &&
        chest.y - edge.y <= 0.2 * stature &&
        Math.hypot(chest.x - edge.x, chest.z - edge.z) <= 0.15,
    );
    for (const side of ["left", "right"] as const) {
      const ankle = bones.get(`${side}Foot`)!.worldPosition;
      TestValidator.predicate(
        "bench lift leaves each ankle grounded",
        Math.abs(
          ankle.y - hip.bones("a", 0.1).get(`${side}Foot`)!.worldPosition.y,
        ) <= 0.01,
      );
      if (t === top) {
        const shank = Vector3.subtract(
          bones.get(`${side}LowerLeg`)!.worldPosition,
          ankle,
        );
        TestValidator.predicate(
          "shank within ten degrees of vertical",
          (Math.acos(shank.y / Vector3.length(shank)) * 180) / Math.PI <= 10,
        );
      }
    }
  }
  const midHip = (t: number) => {
    const joints = hip.bones("a", t);
    return (
      (joints.get("leftUpperLeg")!.worldPosition.y +
        joints.get("rightUpperLeg")!.worldPosition.y) /
      2
    );
  };
  TestValidator.predicate(
    "bench hip travel exceeds eight percent of stature",
    midHip(top) - midHip(bottom) > 0.08 * stature,
  );
  for (const [model, name, low, high, rise] of [
    [createDumbbell({ mass: 8 }), "curl", "down1", "top1", 0.15],
    [
      createKettlebell({ mass: 16 }),
      "kettlebellSwing",
      "back1",
      "float1",
      0.25,
    ],
  ] as const) {
    const mark = model.affordance("grip").frame.translation;
    const run: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "loaded",
      performers: [performer],
      laws: [
        AutoMovieMotionHumanWorkout.HumanSportGym.curl,
        AutoMovieMotionHumanWorkout.HumanSportWorkout.kettlebellSwing,
      ],
      props: [
        HumanObject.prop("bell", model, {
          position: {
            x: -0.12 * stature,
            y: 0.56 * stature - mark.y,
            z: 0.12 * stature,
          },
          rotation: Quaternion.identity(),
        }),
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .pickUp({ prop: "bell", handle: "grip" })
        .registered(name, { count: 1, load: { prop: "bell" } }).node,
    });
    const phase = run.segments("a").at(-1)!,
      a = event(phase, low),
      b = event(phase, high);
    for (const t of [a, b]) {
      const pose = run.prop("bell", t);
      TestValidator.predicate(
        "wrist tracks the declared grip",
        Vector3.distance(
          run.bones("a", t).get("rightHand")!.worldPosition,
          Vector3.add(
            pose.position,
            Quaternion.rotateVector(pose.rotation, mark),
          ),
        ) <= 0.12,
      );
    }
    TestValidator.predicate(
      "weight rises by the authored exercise range",
      run.prop("bell", b).position.y - run.prop("bell", a).position.y >
        rise * stature,
    );
  }
  const swings = Object.values(
    AutoMovieMotionHumanSwing.HumanSportSwing,
  ).filter((row) => typeof row === "object" && row !== null && "plan" in row);
  TestValidator.predicate(
    "sport swings have distinct registered laws",
    swings.length > 0 &&
      new Set(swings.map((r) => r.name)).size === swings.length,
  );
  const standing = new HumanPerformance({
    seed: "loaded",
    performers: [performer],
    composition: stand,
  });
  const initial = standing.segments("a")[0]!.context.entry;
  const bones = poseBones(body, initial.pose);
  const grip = HumanHand.frame(body, bones, "right", "grip").point;
  // Align the right bar handle to the holding grip, then author that hold
  // as the input to the load writer. Pickup is a separate composition.
  const position = Vector3.subtract(
    grip,
    bar.affordance("gripRight").frame.translation,
  );
  const film = new HumanPerformance({
    seed: "loaded",
    performers: [performer],
    composition: stand,
    props: [
      HumanObject.prop("bar", bar, {
        position,
        rotation: Quaternion.identity(),
      }),
    ],
  });
  const original = film.segments("a")[0]!.context;
  const context = {
    ...original,
    entry: { ...original.entry, holds: { right: "bar" } },
  };
  const both = AutoMovieMotionHumanWorkout.WorkoutLoad.of(context, {
    prop: "bar",
    handle: "gripRight",
    other: "gripLeft",
  });
  const one = AutoMovieMotionHumanWorkout.WorkoutLoad.of(context, {
    prop: "bar",
    handle: "gripRight",
  });
  const pose = context.entry.posture;
  TestValidator.equals(
    "one hand leaves other arm goal untouched",
    one.apply(pose).limbs.leftArm,
    pose.limbs.leftArm,
  );
  const placed = poseBones(body, resolveHumanPosture(body, both.apply(pose)));
  const before = poseBones(body, resolveHumanPosture(body, pose)).get(
    "rightHand",
  )!;
  const after = placed.get("rightHand")!;
  const carried = film.prop("bar", film.segments("a").at(-1)!.start);
  const handle = (id: Grip) => {
    const initial = Vector3.add(
      carried.position,
      Quaternion.rotateVector(
        carried.rotation,
        bar.affordance(id).frame.translation,
      ),
    );
    const local = Quaternion.rotateVector(
      Quaternion.inverse(before.worldRotation),
      Vector3.subtract(initial, before.worldPosition),
    );
    return Vector3.add(
      after.worldPosition,
      Quaternion.rotateVector(after.worldRotation, local),
    );
  };
  const left = handle("gripLeft"),
    right = handle("gripRight");
  const level = Math.abs(left.y - right.y);
  const leftGap = Vector3.distance(placed.get("leftHand")!.worldPosition, left);
  const rightGap = Vector3.distance(after.worldPosition, right);
  TestValidator.predicate(
    `handle height difference ${level} m (limit 0.015), left wrist gap ${leftGap} m and right ${rightGap} m (limit 0.12 each)`,
    level <= 0.015 && leftGap <= 0.12 && rightGap <= 0.12,
  );
}

/** The left and right grip affordances of the physical bar. */
type Grip = "gripLeft" | "gripRight";
