import { bindProfileGaits } from "@automovie/engine";
import type { IAutoMovieGait, IAutoMovieProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../features/internal/throwsError";

/**
 * Gait names index rig-bound clips without collision with object properties.
 *
 * Scenarios:
 * 1. Bind a reserved and an ordinary name, a duplicate and an empty profile.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Gait names index rig-bound clips without collision with object properties.
 * @evidence contracts/development/testing.md#independent-expectations A clip inherits the caller’s skeleton, the authored period and the profile/name identity.
 * @evidence contracts/development/testing.md#distinguishing-cases A duplicated name is an error even when both gait records would produce the same clip.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_gait_gait_profile_binding(): void {
  const gait: IAutoMovieGait = {
    name: "__proto__",
    period: 0.6,
    limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 20 }],
  };
  const profile: IAutoMovieProfile = {
    id: "walker",
    name: "walker",
    drivers: [],
    limits: [],
    gaits: [gait, { ...gait, name: "step", period: 1 }],
  };
  const clips = bindProfileGaits(profile, "rig", 4);
  TestValidator.equals(
    "ordinary and prototype names remain own keys",
    Object.keys(clips).sort((a, b) => a.localeCompare(b, "en")),
    ["__proto__", "step"],
  );
  TestValidator.predicate(
    "plain result and rig-specific clip",
    Object.getPrototypeOf(clips) === Object.prototype &&
      clips["__proto__"]!.skeleton === "rig" &&
      clips["__proto__"]!.id === "walker:__proto__" &&
      clips["__proto__"]!.duration === 0.6 &&
      clips.step!.duration === 1,
  );
  TestValidator.equals(
    "independent target skeleton",
    bindProfileGaits(profile, "second", 4).step!.skeleton,
    "second",
  );
  TestValidator.equals(
    "empty registry",
    Object.keys(bindProfileGaits({ ...profile, gaits: [] }, "rig", 4)),
    [],
  );
  TestValidator.predicate(
    "duplicate exact name refused",
    throwsError(() =>
      bindProfileGaits({ ...profile, gaits: [gait, gait] }, "rig", 4),
    ),
  );
}
