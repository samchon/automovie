import { retargetHumanoidMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  nclose,
  validationHasNoWarnings,
} from "../internal/predicates";
import {
  keyframeWorld,
  proportionedRig,
  rootShiftClip,
} from "../internal/retargetRigs";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Observe grounded versus airborne authored keys and the no-ground-contact boundary of retarget correction. The no-contact clip must retain the same plain-record fields and exact finite numeric values as the explicitly disabled pass.
 *
 * Source-ground detection gates per-key correction. This unit inspects sparse joints and numeric clip data; it neither infers audience perception nor claims that airborne position has no observable meaning.
 *
 * Scenarios:
 *
 * 1. A clip whose second keyframe lifts the root a full unit leaves the feet above
 *    the source rig's floor plus tolerance, so only the grounded first keyframe
 *    is corrected and the airborne one keeps its empty authored pose.
 * 2. Declaring a ground plane far below the rig removes every contact, and the
 *    corrected clip becomes deep-equal to the verbatim angle copy: the
 *    no-contact boundary.
 * 3. A single-keyframe clip is rejected by the clip validator, not by a crash
 *    inside the contact pass, and returns a field-located temporal violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets a root-lift clip and checks grounded correction versus an empty airborne joint population, compares a low-ground retarget with explicitly disabled correction, and observes the single-key source refusal envelope and located temporal violation.
 * @evidence contracts/testing.md#independent-expectations Synthetic rest offsets put the lifted source foot at literal y=1.1, while ground -5 excludes every authored source key. Original empty joint and diagnostic path expectations are literal; the disabled twin alone is a metamorphic boundary rather than an independent retarget implementation. test12ValuesClose retains own fields, array order/length and finite numeric equality with nclose eps0; prototypes, NaN payloads and signed-zero identity are not this fixture's oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains grounded/airborne keys, ordinary versus deliberately low ground, enabled versus disabled contact, and the one-key invalid source. Achieved nonproportional contacts and hand windows belong to separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every direct retarget and fixture-FK call, including returned failure observation. Existing fixture/comparison helpers register no additional cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_airborne(): void {
  const source: IAutoMovieSkeleton = proportionedRig("airborne-source");
  const target: IAutoMovieSkeleton = proportionedRig("airborne-target", {
    leg: 1.05,
    torso: 0.98,
  });

  // 1. a jump: grounded first keyframe, airborne second.
  const jump: IAutoMovieMotion = rootShiftClip(source.id, { x: 0, y: 1, z: 0 });
  TestValidator.predicate(
    "the lifted keyframe leaves the source foot above the floor",
    nclose(keyframeWorld(source, jump, 1, "leftFoot").y, 1.1),
  );

  const jumped: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({ motion: jump, source, target });
  TestValidator.predicate(
    "a reachable grounded contact reports no warning",
    validationHasNoWarnings("reachable grounded contact", jumped.validation),
  );
  if (jumped.motion === null) throw new Error("jump retarget failed");
  TestValidator.predicate(
    "the grounded keyframe is corrected",
    jumped.motion.keyframes[0]!.pose.joints.length > 0,
  );
  TestValidator.equals(
    "the airborne keyframe keeps its authored pose",
    jumped.motion.keyframes[1]!.pose.joints,
    [],
  );
  // 2. no contact anywhere: identical to carrying the angles verbatim.
  const slide: IAutoMovieMotion = rootShiftClip(source.id, {
    x: 0,
    y: 0,
    z: 0.25,
  });
  const ungrounded: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: slide,
      source,
      target,
      contacts: { groundY: -5 },
    });
  const carried: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: slide,
      source,
      target,
      contacts: { enabled: false },
    });
  TestValidator.predicate(
    "no ground contact reports no warning",
    validationHasNoWarnings("ungrounded retarget", ungrounded.validation),
  );
  TestValidator.predicate(
    "disabled contact reports no warning",
    validationHasNoWarnings("contact-disabled retarget", carried.validation),
  );
  if (ungrounded.motion === null || carried.motion === null)
    throw new Error("ungrounded retarget failed");
  TestValidator.predicate(
    "a clip with no contact is left as the verbatim copy",
    test12ValuesClose(ungrounded.motion, carried.motion),
  );
  // 3. a single-keyframe clip fails validation instead of crashing the pass.
  const lone: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: rootShiftClip(source.id, { x: 0, y: 0, z: 0.25 }, [0]),
      source,
      target,
    });
  TestValidator.equals(
    "a single-keyframe clip returns no motion",
    lone.motion,
    null,
  );
  TestValidator.predicate(
    "the keyframe count is reported as a temporal violation",
    hasViolation(lone.validation, "temporal", "$input.motion.keyframes"),
  );
}
