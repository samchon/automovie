import { AutoMovieMotionHumanChannel as C, type IHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Prepared channel selection owns fixed claims while current posture payloads
 * keep their original borrowed ownership and missing-field clearing rules.
 *
 * Scenarios:
 * 1. Root, trunkTurn, left arm and left thumb take exactly their written
 *    fields. A missing claimed arm goal, thumb goal and spine joint clear;
 *    the pelvis, scalar trunk pose, index finger and right arm stay from base.
 * 2. Editing the caller's claim array cannot change the prepared selector;
 *    a new selector adopts the new right-arm claim. The prepared result keeps
 *    surviving base joints before current claimed written joints in order.
 * 3. Replacing current input joint/root payloads changes the next result.
 *    Every result owns fresh joint/limb/digit wrappers while numeric angle
 *    tuples, goals and chosen root remain borrowed as the merge contract says.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines claim snapshot scope, root/trunkTurn/digit distinctions, borrowed payload versus fresh wrappers and three selection/clearing/ownership scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepareMerge with changing actual postures and claim-array edits, checks selected and omitted numeric fields, cleared joints/goals/rotation, insertion order, new preparation behavior, fresh wrappers and documented borrowed references.
 * @evidence contracts/development/testing.md#independent-expectations Explicitly different base/written constants identify each field owner. TrunkTurn owns spine/chest but neither pelvis nor pitch/roll; a thumb owns its own joints/goals but not index; root owns root/yaw/rotation. These declared partitions independently determine the expected values and absent fields, without cold merge output as oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers root/partial-trunk/one-digit/one-arm claims, absent written fields, unclaimed payloads, claim mutation/new preparation, input payload replacement, insertion order and wrapper versus borrowed-data ownership. Other entries own full channel taxonomy and composer dependency propagation.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns plain posture records and mutable claim arrays, calls only public source and starts no Human producer, process, renderer or compiler. No foreign function or global is replaced.
 */
export function test_motion_prepared_channel_merge(): void {
  const base: IHumanPosture = {
    root: { x: 1, y: 0, z: 0 }, yaw: 10, pitch: 2, roll: 3,
    rotation: { about: { x: 0, y: 0, z: 0 }, turn: { x: 0, y: 0, z: 0, w: 1 } },
    joints: { hips: [1, 0, 0], spine: [2, 0, 0], leftThumbProximal: [3, 0, 0],
      leftIndexProximal: [4, 0, 0], leftUpperArm: [5, 0, 0], head: [6, 0, 0] },
    limbs: { leftArm: goal(1), rightArm: goal(2) },
    digits: { leftThumb: digit(3), leftIndex: digit(4), rightThumb: digit(5) },
  };
  const written: IHumanPosture = {
    root: { x: 9, y: 8, z: 7 }, yaw: 90, pitch: 20, roll: 30,
    joints: { head: [66, 0, 0], chest: [22, 0, 0], leftThumbProximal: [33, 0, 0], rightUpperArm: [77, 0, 0] },
    limbs: { rightArm: goal(8) }, digits: {},
  };
  const claims: C.Claim[] = ["root", "trunkTurn", "leftArm", "leftThumb"];
  const merge: ReturnType<typeof C.prepareMerge> = C.prepareMerge(claims);
  claims.splice(0, claims.length, "rightArm");
  const first: IHumanPosture = merge(base, written);
  TestValidator.predicate("fixed claims select exactly their current scalar and joint owners",
    first.root === written.root && nclose(first.yaw, 90, 0) &&
    nclose(first.pitch, 2, 0) && nclose(first.roll, 3, 0) &&
    nclose(first.joints.hips![0], 1, 0) && nclose(first.joints.leftIndexProximal![0], 4, 0) &&
    nclose(first.joints.head![0], 6, 0) && nclose(first.joints.chest![0], 22, 0) &&
    nclose(first.joints.leftThumbProximal![0], 33, 0),
  );
  TestValidator.predicate("claimed absent fields clear rather than inheriting old payloads",
    first.rotation === undefined && first.joints.spine === undefined &&
    first.joints.leftUpperArm === undefined && first.limbs.leftArm === undefined &&
    first.digits?.leftThumb === undefined && first.limbs.rightArm === base.limbs.rightArm &&
    first.digits?.leftIndex === base.digits!.leftIndex && first.digits?.rightThumb === base.digits!.rightThumb,
  );
  TestValidator.equals("surviving base joints precede selected written joints", Object.keys(first.joints),
    ["hips", "leftIndexProximal", "head", "chest", "leftThumbProximal"],
  );
  const nextClaims: IHumanPosture = C.prepareMerge(claims)(base, written);
  TestValidator.predicate("new preparation adopts the edited claim array",
    nextClaims.root === base.root && nextClaims.rotation === base.rotation &&
    nextClaims.limbs.rightArm === written.limbs.rightArm &&
    nextClaims.limbs.leftArm === base.limbs.leftArm &&
    nclose(nextClaims.joints.rightUpperArm![0], 77, 0) && nclose(nextClaims.joints.spine![0], 2, 0),
  );

  base.joints.head = [7, 0, 0];
  written.joints.chest = [23, 0, 0];
  written.root = { x: 10, y: 11, z: 12 };
  const second: IHumanPosture = merge(base, written);
  TestValidator.predicate("fixed claims never cache changing input payloads",
    second.root === written.root && nclose(second.root.x, 10, 0) &&
    nclose(second.joints.head![0], 7, 0) && nclose(second.joints.chest![0], 23, 0) &&
    nclose(first.joints.head![0], 6, 0) && nclose(first.joints.chest![0], 22, 0),
  );
  TestValidator.predicate("fresh result wrappers keep selected payload ownership explicit",
    second !== first && second.joints !== first.joints && second.limbs !== first.limbs &&
    second.digits !== first.digits && second.joints.head === base.joints.head &&
    second.joints.chest === written.joints.chest && second.limbs.rightArm === base.limbs.rightArm,
  );
  first.joints.head = [123, 0, 0];
  first.limbs.rightArm = goal(456);
  const replay: IHumanPosture = merge(base, written);
  TestValidator.predicate("mutating an earlier wrapper cannot change later selection",
    nclose(replay.joints.head![0], 7, 0) && replay.limbs.rightArm === base.limbs.rightArm &&
    nclose(first.joints.head![0], 123, 0) && nclose(first.limbs.rightArm.point.x, 456, 0),
  );
}

/** Create one owned world-space limb goal with a distinguishable point. */
function goal(x: number): IHumanPosture.IGoal {
  return { point: { x, y: 0, z: 0 }, bend: { x, y: 1, z: 0 } };
}

/** Create one owned fingertip goal without an unrelated limb dependency. */
function digit(x: number): IHumanPosture.IDigitGoal {
  return { point: { x, y: 0, z: 0 }, surface: "tip" };
}
