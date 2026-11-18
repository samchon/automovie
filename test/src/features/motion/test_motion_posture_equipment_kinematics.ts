import { createBarbell } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  WorkoutLoad,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

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
  const stand = HumanChain.subject("a").stand({ seconds: 0.3, sway: 0 }).node;
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
  const both = WorkoutLoad.of(context, {
    prop: "bar",
    handle: "gripRight",
    other: "gripLeft",
  });
  const one = WorkoutLoad.of(context, { prop: "bar", handle: "gripRight" });
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
