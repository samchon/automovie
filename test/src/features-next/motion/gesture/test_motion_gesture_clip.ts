import {
  DEFAULT_HUMANOID_ROM,
  blendPoses,
  gestureMotion,
  validateMotion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../../features/internal/fixtures";
import { hasViolation } from "../../../features/internal/predicates";

/**
 * Gesture clips preserve clinical joint axes and independently owned keyframes.
 * Scenarios:
 * - The bow, nod, shake, crouch, stagger and arm gestures claim the appropriate joint and axis, start and stop at rest and remain within ROM.
 * - A jump lowers, rises and returns to the same ground height. An unsupported kind returns null.
 * - Editing an issued joint array cannot change its next independently requested clip.
 * - Composite elbow flexion inside or outside the supported range produces the corresponding validation result.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the actual generated motion keys and validates the blended motion at its public consumer.
 * @evidence contracts/development/testing.md#independent-expectations Neutral start and end, positive mirrored arm elevation and negative/positive jump displacement come from the documented clinical axes and floor.
 * @evidence contracts/development/testing.md#distinguishing-cases Different anatomical axes, directional and bilateral arm gestures, ground departure and return, valid and invalid compounded flexion.
 * @evidence contracts/development/testing.md#execution-ownership Generates one independent clip per gesture output and two single-pose blend observations.
 * @evidence contracts/development/common.md#meaningful-documentation Names the pose channels and the validated boundary.
 */
export function test_motion_gesture_clip(): void {
  const rig = {
    id: "humanoid",
    bones: (
      [
        "spine",
        "head",
        "leftUpperArm",
        "rightUpperArm",
        "leftLowerArm",
        "rightLowerArm",
        "leftUpperLeg",
        "rightUpperLeg",
        "leftLowerLeg",
        "rightLowerLeg",
      ] as const
    ).map((bone) => ({
      bone,
      parent: null,
      rest: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      constraint: DEFAULT_HUMANOID_ROM[bone] ?? null,
    })),
  };
  const clip = (kind: string) => {
    const motion = gestureMotion(kind, rig.id, kind, 1);
    if (!motion) throw new Error(kind + " missing");
    return motion;
  };
  const peak = (
    motion: ReturnType<typeof clip>,
    bone: AutoMovieHumanoidBone,
    axis: GestureAxis,
  ): number =>
    Math.max(
      ...motion.keyframes.map((k) =>
        Math.abs(k.pose.joints.find((j) => j.bone === bone)?.[axis] ?? 0),
      ),
    );
  for (const [kind, bone, axis, threshold] of [
    ["bow", "spine", "flexion", 30],
    ["nod", "head", "flexion", 10],
    ["shake", "head", "twist", 10],
    ["crouch", "leftLowerLeg", "flexion", 30],
    ["stagger", "spine", "abduction", 15],
    ["wave", "rightLowerArm", "flexion", 30],
    ["celebrate", "leftUpperArm", "abduction", 120],
  ] as const) {
    const motion = clip(kind),
      frames = motion.keyframes;
    TestValidator.equals(
      kind + " validates against the humanoid ROM",
      validateMotion({ motion, skeleton: rig }).success,
      true,
    );
    TestValidator.predicate(
      kind + " returns to neutral",
      !motion.loop &&
        frames.length >= 3 &&
        [frames[0]!, frames[frames.length - 1]!].every((k) =>
          k.pose.joints.every(
            (j) => (j.flexion ?? 0) === 0 && (j.twist ?? 0) === 0,
          ),
        ),
    );
    TestValidator.predicate(
      kind + " clinical channel",
      peak(motion, bone, axis) > threshold,
    );
    if (kind === "wave" || kind === "celebrate") {
      const signed = (b: AutoMovieHumanoidBone) =>
        Math.max(
          ...frames.map(
            (k) => k.pose.joints.find((j) => j.bone === b)?.abduction ?? 0,
          ),
        );
      TestValidator.predicate(
        kind + " lifts by positive abduction",
        signed("rightUpperArm") > 120 &&
          (kind !== "celebrate" ||
            Math.abs(signed("leftUpperArm") - signed("rightUpperArm")) < 1e-9),
      );
    }
    if (kind === "stagger")
      TestValidator.predicate(
        "a stagger steps to recover",
        peak(motion, "rightUpperLeg", "flexion") > 15,
      );
  }
  const jump = clip("jump").keyframes.map(
    (k) => k.pose.root?.translation.y ?? 0,
  );
  TestValidator.predicate(
    "jump crouches, lifts and lands",
    jump[0] === 0 &&
      jump[jump.length - 1] === 0 &&
      Math.min(...jump) < 0 &&
      Math.max(...jump) > 0.2,
  );
  TestValidator.equals(
    "unowned gesture",
    gestureMotion("unknown", rig.id, "somersault", 1),
    null,
  );
  const issued = clip("bow"),
    expected = structuredClone(issued.keyframes[1]!.pose.joints);
  issued.keyframes[1]!.pose.joints[0]!.flexion = 999;
  issued.keyframes[1]!.pose.joints.push(joint("jaw", { flexion: 1 }));
  TestValidator.equals(
    "issued clip is independent",
    clip("bow").keyframes[1]!.pose.joints,
    expected,
  );
  for (const [a, b, valid] of [
    [300, 300, false],
    [40, 80, true],
  ] as const) {
    const pose = blendPoses(
      [a, b].map((degrees) => ({
        pose: makePose([joint("leftLowerArm", { flexion: degrees })]),
        weight: 1,
      })),
    );
    const report = validateMotion({
      motion: makeMotion([keyframe(0, pose), keyframe(1, pose)], 1),
      skeleton: createSkeleton(),
    });
    TestValidator.predicate(
      "blended elbow " + a + " / " + b,
      report.success === valid &&
        (valid || hasViolation(report, "rom", ".flexion")),
    );
  }
}
type GestureAxis = keyof Pick<
  IAutoMovieJointPose,
  "flexion" | "abduction" | "twist"
>;
