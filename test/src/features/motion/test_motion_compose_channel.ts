import { HumanChannel, type IHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The channels partition a posture: every bone belongs to one channel, and a
 * merge takes exactly the fields the named channels own.
 *
 * Scenarios:
 * 1. The pelvis, the spine and a shoulder girdle belong to the trunk; the
 *    neck, the head, the jaw and an eye to the head; the upper arm, the
 *    forearm and the hand to their arm; a finger and a thumb segment to their
 *    hand; the thigh, the shank, the foot and the toes to their leg.
 * 2. Merging the trunk and the left arm takes the pitch, the roll, the spine
 *    joint and the left arm's goal from the written posture, and keeps the
 *    root, the heading, the head joint and the other limbs' goals.
 * 3. A trunk joint and a left arm goal the written posture no longer sets are
 *    cleared.
 * 4. Merging the root alone takes the root and the heading and nothing else.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public mapping and merge and reads the returned channel names and posture fields; a bone filed under the wrong channel or a field leaking across channels fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected channel of each bone is the anatomical part it belongs to, written out per bone, and the merged posture is assembled by hand from two postures with distinct values in every field.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every channel kind on both sides, taken and kept fields of each posture member, cleared joints and goals, and the root alone.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain postures; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_compose_channel(): void {
  TestValidator.equals(
    "bones by channel",
    (
      [
        "hips",
        "spine",
        "chest",
        "leftShoulder",
        "neck",
        "head",
        "jaw",
        "rightEye",
        "leftUpperArm",
        "rightLowerArm",
        "rightHand",
        "rightIndexProximal",
        "leftThumbDistal",
        "leftUpperLeg",
        "rightLowerLeg",
        "rightFoot",
        "leftToes",
      ] as const
    ).map(HumanChannel.of),
    [
      "trunk",
      "trunk",
      "trunk",
      "trunk",
      "head",
      "head",
      "head",
      "head",
      "leftArm",
      "rightArm",
      "rightArm",
      "rightHand",
      "leftHand",
      "leftLeg",
      "rightLeg",
      "rightLeg",
      "leftLeg",
    ],
  );

  const goal = (x: number): IHumanPosture.IGoal => ({
    point: { x, y: 0, z: 0 },
    bend: { x, y: 1, z: 0 },
  });
  const base: IHumanPosture = {
    root: { x: 1, y: 0, z: 0 },
    yaw: 10,
    pitch: 1,
    roll: 2,
    joints: { spine: [1, 0, 0], chest: [2, 0, 0], head: [3, 0, 0] },
    limbs: { leftArm: goal(1), rightArm: goal(2), leftLeg: goal(3) },
  };
  const written: IHumanPosture = {
    root: { x: 9, y: 9, z: 9 },
    yaw: 90,
    pitch: 30,
    roll: 40,
    joints: { spine: [50, 0, 0], head: [60, 0, 0] },
    limbs: { leftArm: goal(7), rightArm: goal(8) },
  };
  TestValidator.equals(
    "the trunk and the left arm are taken, the rest kept",
    HumanChannel.merge(base, written, ["trunk", "leftArm"]),
    {
      root: { x: 1, y: 0, z: 0 },
      yaw: 10,
      pitch: 30,
      roll: 40,
      joints: { head: [3, 0, 0], spine: [50, 0, 0] },
      limbs: { leftArm: goal(7), rightArm: goal(2), leftLeg: goal(3) },
    },
  );
  TestValidator.equals(
    "a goal the written posture dropped is cleared",
    HumanChannel.merge(base, { ...written, limbs: {} }, ["leftArm"]).limbs,
    { rightArm: goal(2), leftLeg: goal(3) },
  );
  TestValidator.equals(
    "the root alone",
    HumanChannel.merge(base, written, ["root"]),
    { ...base, root: { x: 9, y: 9, z: 9 }, yaw: 90 },
  );
}
