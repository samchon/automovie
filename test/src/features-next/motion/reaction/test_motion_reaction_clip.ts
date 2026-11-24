import { reactMotion, validateMotion } from "@automovie/engine";
import type { IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { throwsError } from "../../../features/internal/throwsError";

/**
 * The reaction clip applies effective joint limits only during the flinch.
 *
 * Scenarios:
 * 1. Read authored and default flexion limits in one rig including a rest pose outside the numeric interval.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The reaction clip applies effective joint limits only during the flinch.
 * @evidence contracts/development/testing.md#independent-expectations A spine limited to negative thirty degrees and a default chest limited to negative twenty clamp a stronger request independently.
 * @evidence contracts/development/testing.md#distinguishing-cases An omitted peak scales below four tenths of a second and is capped for longer motion; explicit peaks must be strictly interior.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_reaction_clip(): void {
  const rig = motionHumanBody("m-average").skeleton;
  const bones: IAutoMovieBone[] = rig.bones
    .filter((b) => b.bone === "spine" || b.bone === "chest")
    .map((b) => ({
      ...b,
      parent: null,
      constraint:
        b.bone === "spine"
          ? { flexion: { min: -30, max: -5 }, abduction: null, twist: null }
          : null,
    }));
  const skeleton: IAutoMovieSkeleton = { id: "reaction", bones };
  const clip = (duration: number, peak?: number) =>
    reactMotion(
      "recoil",
      skeleton,
      { flexion: -60 },
      ["spine", "chest"],
      duration,
      peak,
    );
  const result = clip(1, 0.2);
  TestValidator.equals(
    "explicit triplet",
    result.keyframes.map((k) => k.time),
    [0, 0.2, 1],
  );
  TestValidator.predicate(
    "skeleton and effective range admission",
    result.skeleton === skeleton.id &&
      validateMotion({ motion: result, skeleton }).success,
  );
  for (const [bone, limit] of [
    ["spine", -30],
    ["chest", -20],
  ] as const) {
    const values = result.keyframes.map(
      (k) => k.pose.joints.find((j) => j.bone === bone)!.flexion,
    );
    TestValidator.equals("neutral endpoints and clamped peak", values, [
      null,
      limit,
      null,
    ]);
  }
  TestValidator.predicate(
    "short default scales and long default caps",
    nclose(clip(0.1).keyframes[1]!.time, 0.04) &&
      nclose(clip(0.5).keyframes[1]!.time, 0.16),
  );
  for (const bad of [NaN, 0, -1])
    TestValidator.predicate(
      "positive finite duration",
      throwsError(() => clip(bad)),
    );
  for (const bad of [NaN, 0, -0.1, 1])
    TestValidator.predicate(
      "strictly interior peak",
      throwsError(() => clip(1, bad)),
    );
}
