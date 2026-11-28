import type {
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  motionHumanChannel
} from "../../../../../packages/motions/src/compose/internal/motionHumanChannel";
import { TestValidator } from "@nestia/e2e";

/** A goal at a height, planted or not. */
function goal(y: number, planted: boolean): IAutoMovieHumanLimbGoal {
  return {
    point: { x: 0.1, y, z: 0.2 },
    bend: { x: 0.1, y: y + 0.3, z: 0.5 },
    planted,
  };
}

/**
 * The base action: a walk mid-stride, its root moving, its left foot planted,
 * its arms swinging.
 */
const WALK: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 1.2 },
  yaw: 10,
  pitch: 2,
  roll: 0,
  joints: {
    spine: [3, 0, 0],
    leftUpperLeg: [-10, 0, 0],
    rightUpperLeg: [20, 0, 0],
    leftUpperArm: [15, 0, 0],
    rightUpperArm: [-15, 0, 0],
    rightLowerArm: [10, 0, 0],
    rightIndexProximal: [5, 0, 0],
  },
  limbs: { leftLeg: goal(0.08, true), rightLeg: goal(0.2, false) },
};

/**
 * The overlay's own posture: written on a standing body, its right arm raised
 * for a wave and its fingers spread, its root and legs where it stood.
 */
const WAVE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.92, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {
    spine: [0, 0, 0],
    leftUpperLeg: [0, 0, 0],
    rightUpperArm: [150, 20, 0],
    rightIndexProximal: [-10, 0, 0],
    leftUpperArm: [0, 0, 0],
  },
  limbs: { rightArm: goal(1.9, false), leftLeg: goal(0, true) },
};

/**
 * `motionHumanChannel.merge` lays an overlay over its base action: the
 * channels the overlay claims, and only those, are taken from the overlay's
 * posture, every other field kept as the base has it. So an arm overlay over a
 * walk or a carry takes the arm and keeps the root, the trunk and both legs,
 * the planted foot's goal among them: the base's support is untouched. A joint
 * the overlay's posture no longer sets on a claimed channel is cleared; a digit
 * claim takes that digit alone; `trunkTurn` covers the spine and chest but not
 * the shoulders.
 *
 * Scenarios, a walk with its left foot planted under a wave's posture:
 *
 * 1. A one-hand wave (`rightArm`, `rightHand`) takes the right arm's joints, the
 *    right index and the right arm's goal; the root, heading, pitch, spine,
 *    both legs' joints, the planted left leg's goal and the left arm are the
 *    walk's.
 * 2. The right forearm, which the wave does not set, is cleared.
 * 3. A two-hand clap (`leftArm`, `rightArm`) takes both arms and still keeps every
 *    leg joint and goal.
 * 4. A claim of the right index alone takes that digit's joint and no arm.
 * 5. `trunkTurn` covers the spine, not a shoulder; a hand's channel covers its
 *    fingers.
 * 6. A prepared merge copies its claims and retains their ownership across reverse
 *    input order, including a previously unobserved owned joint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes unilateral and bilateral overlay ownership, cleared owned values, a single digit, and prepared reads after claim changes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the direct and prepared channel merge owners on distinct base and overlay postures and checks field identities across a reversed sample order.
 * @evidence contracts/development/testing.md#independent-expectations Authored references identify which source owns each joint or limb. The absent wave forearm clears that owned slot, while the base's planted foot, root and unclaimed arm keep their original values.
 */
export function test_motions_compose_channel_merge(): void {
  // 1. A one-hand wave.
  const waved: IAutoMovieMotionHumanPosture = motionHumanChannel.merge(
    WALK,
    WAVE,
    ["rightArm", "rightHand"],
  );
  TestValidator.predicate(
    "the wave takes the right arm and keeps the walk's support",
    waved.joints.rightUpperArm === WAVE.joints.rightUpperArm &&
      waved.joints.rightIndexProximal === WAVE.joints.rightIndexProximal &&
      waved.limbs.rightArm === WAVE.limbs.rightArm &&
      waved.root === WALK.root &&
      waved.yaw === WALK.yaw &&
      waved.pitch === WALK.pitch &&
      waved.joints.spine === WALK.joints.spine &&
      waved.joints.leftUpperLeg === WALK.joints.leftUpperLeg &&
      waved.joints.rightUpperLeg === WALK.joints.rightUpperLeg &&
      waved.limbs.leftLeg === WALK.limbs.leftLeg &&
      waved.limbs.rightLeg === WALK.limbs.rightLeg &&
      waved.joints.leftUpperArm === WALK.joints.leftUpperArm,
  );

  // 2. A claimed joint the overlay does not set.
  TestValidator.predicate(
    "the unset forearm is cleared",
    waved.joints.rightLowerArm === undefined,
  );

  // 3. A two-hand clap.
  const clapped: IAutoMovieMotionHumanPosture =
    motionHumanChannel.merge(WALK, WAVE, ["leftArm", "rightArm"]);
  TestValidator.predicate(
    "the clap takes both arms and keeps the legs",
    clapped.joints.leftUpperArm === WAVE.joints.leftUpperArm &&
      clapped.joints.rightUpperArm === WAVE.joints.rightUpperArm &&
      clapped.joints.rightIndexProximal === WALK.joints.rightIndexProximal &&
      clapped.joints.leftUpperLeg === WALK.joints.leftUpperLeg &&
      clapped.limbs.leftLeg === WALK.limbs.leftLeg &&
      clapped.limbs.rightLeg === WALK.limbs.rightLeg &&
      clapped.root === WALK.root,
  );

  // 4. One digit.
  const pointed: IAutoMovieMotionHumanPosture =
    motionHumanChannel.merge(WALK, WAVE, ["rightIndex"]);
  TestValidator.predicate(
    "a digit claim takes the digit alone",
    pointed.joints.rightIndexProximal === WAVE.joints.rightIndexProximal &&
      pointed.joints.rightUpperArm === WALK.joints.rightUpperArm &&
      pointed.limbs.rightArm === undefined,
  );

  // 5. Coverage.
  TestValidator.predicate(
    "trunk turn and hand coverage",
    motionHumanChannel.covers(["trunkTurn"], "spine") &&
      !motionHumanChannel.covers(["trunkTurn"], "leftShoulder") &&
      motionHumanChannel.covers(["leftHand"], "leftThumbDistal") &&
      !motionHumanChannel.covers(["leftHand"], "leftLowerArm") &&
      motionHumanChannel.claims(["rightHand"], "rightIndex"),
  );

  const claims: AutoMovieMotionHumanChannelClaim[] = [
    "rightIndex",
    "trunkTurn",
  ];
  const prepared: ReturnType<typeof motionHumanChannel.prepareMerge> =
    motionHumanChannel.prepareMerge(claims);
  claims.push("leftLeg");
  const first: IAutoMovieMotionHumanPosture = prepared(WALK, WAVE);
  const second: IAutoMovieMotionHumanPosture = prepared(WAVE, WALK);
  const then: IAutoMovieMotionHumanPosture = prepared(WALK, {
    ...WAVE,
    joints: { ...WAVE.joints, upperChest: [10, 0, 0] },
  });
  TestValidator.predicate(
    "only copied claims own joints at each read",
    first.joints.spine === WAVE.joints.spine &&
      second.joints.spine === WALK.joints.spine &&
      first.joints.leftUpperLeg === WALK.joints.leftUpperLeg &&
      first.joints.rightIndexProximal === WAVE.joints.rightIndexProximal &&
      then.joints.upperChest?.[0] === 10,
  );
}
