import type { AutoMovieMotionHumanChannel as AutoMovieMotionHumanChannelType, IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AutoMovieMotionHumanChannel, HumanRide, stand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The `trunkTurn` claim (#3491): an act that aims from a carried trunk takes
 * the spine's and the chest's turn about the pelvis, and the carrier keeps
 * the pelvis, the shoulder girdles and the rest.
 *
 * Scenarios:
 * 1. `trunkTurn` covers `spine`, `chest` and `upperChest`, and covers
 *    neither `hips` nor either shoulder nor the neck.
 * 2. A merge that takes `trunkTurn` copies the spine's and the chest's
 *    joints from the written posture and keeps the hips, the shoulders, the
 *    root, the pitch and the roll from the base.
 * 3. `HumanRide.ride` and `stand` yield `trunkTurn`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the claim's coverage, merges two postures and reads the carriers' yields; a turn that drags the pelvis or the shoulders, misses the chest, or a carrier that does not yield it fails.
 * @evidence contracts/development/testing.md#independent-expectations The covered bones are #3491's definition, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Covered and uncovered bones; joints and scalars of a merge; two carriers.
 * @evidence contracts/development/testing.md#execution-ownership Calls the channel functions directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios.
 */
export function test_human_motion_channel_trunk_turn(): void {
  const claims: AutoMovieMotionHumanChannelType.Claim[] = ["trunkTurn"];

  // 1. Coverage.
  for (const bone of ["spine", "chest", "upperChest"] as const)
    TestValidator.predicate(
      `trunkTurn covers ${bone}`,
      AutoMovieMotionHumanChannel.covers(claims, bone),
    );
  for (const bone of ["hips", "leftShoulder", "rightShoulder", "neck"] as const)
    TestValidator.predicate(
      `trunkTurn leaves ${bone}`,
      !AutoMovieMotionHumanChannel.covers(claims, bone),
    );

  // 2. A merge.
  const base: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 0,
    pitch: 1,
    roll: 2,
    joints: {
      hips: [1, 0, 0],
      spine: [2, 0, 0],
      chest: [3, 0, 0],
      leftShoulder: [4, 0, 0],
    },
    limbs: {},
  };
  const written: IAutoMovieMotionHumanPosture = {
    root: { x: 5, y: 5, z: 5 },
    yaw: 30,
    pitch: 9,
    roll: 9,
    joints: {
      hips: [10, 0, 0],
      spine: [20, 0, 0],
      chest: [30, 0, 0],
      leftShoulder: [40, 0, 0],
    },
    limbs: {},
  };
  const merged: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanChannel.merge(
    base,
    written,
    claims,
  );
  TestValidator.equals(
    "the spine and the chest come from the act",
    [merged.joints.spine, merged.joints.chest],
    [
      [20, 0, 0],
      [30, 0, 0],
    ],
  );
  TestValidator.equals(
    "the hips and the shoulder stay the carrier's",
    [merged.joints.hips, merged.joints.leftShoulder],
    [
      [1, 0, 0],
      [4, 0, 0],
    ],
  );
  TestValidator.predicate(
    "the root, pitch and roll stay the carrier's",
    merged.root.x === 0 &&
      merged.yaw === 0 &&
      merged.pitch === 1 &&
      merged.roll === 2,
  );

  // 3. The carriers.
  TestValidator.predicate(
    "the ride and the stand yield the trunk's turn",
    (HumanRide.ride.yields ?? []).includes("trunkTurn") &&
      (stand.yields ?? []).includes("trunkTurn"),
  );
}
