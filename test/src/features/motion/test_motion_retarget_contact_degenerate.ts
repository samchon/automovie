import { retargetHumanoidMotion } from "@automovie/engine";
import { IAutoMovieJointConstraint, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  validationHasWarning,
  validationHasWarningCount,
} from "../internal/predicates";
import {
  LEG_BONES,
  proportionedRig,
  rootShiftClip,
  withJointConstraint,
  withZeroLengthBones,
  withoutBones,
} from "../internal/retargetRigs";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** A joint that cannot move on any clinical axis. */
const IMMOBILE: IAutoMovieJointConstraint = {
  flexion: null,
  abduction: null,
  twist: null,
};

/**
 * Observe best-effort retargeting for absent, zero-length and immobile target legs. Existing empty authored-joint expectations and residual warnings constrain these fixtures without promising that every impossible contact is classified or optimally solved.
 *
 * Missing target chains contribute no pin; degenerate or fully immobile chains keep the original empty articulation when fitting cannot improve it. The root-only disabled twin supplies the existing exact root-preservation comparison.
 *
 * Scenarios:
 *
 * 1. A target rig with no legs reports success and keeps both empty joint arrays; complete clip identity is not asserted for this case.
 * 2. A target whose thigh segments collapse to zero length makes the two-bone
 *    solve degenerate; the joints stay empty and the residual is warned about.
 * 3. A target whose leg joints declare every axis immobile clamps each candidate
 *    straight back to rest, so no candidate beats the uncorrected limb and the
 *    authored pose is kept, with the residual still reported.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets with contact disabled and with missing/collapsed/immobile target legs, observes non-null clips and unchanged empty joint arrays, requires the collapsed left-foot warning and two frozen-foot warnings, and compares all frozen roots to the disabled twin.
 * @evidence contracts/testing.md#independent-expectations Local bone removal, zero offsets and null constraint axes independently define the missing/degenerate/immobile cases. Literal empty joints, warning count/path and exact root comparison bound product outcomes; the disabled twin is a metamorphic preservation check, not a second geometry oracle. test12ValuesClose uses nclose eps0 on plain-record numeric leaves and does not certify prototype/NaN/signed-zero identity.
 * @evidence contracts/testing.md#distinguishing-cases Retains missing legs versus collapsed thighs versus frozen clinical axes, source root shift 0.25, a disabled twin, one specifically located collapsed warning and two frozen warnings. Achievable pins, airborne contact masks and hand windows have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all four retarget calls and direct output observations over existing rig mutators. Helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_degenerate(): void {
  const source: IAutoMovieSkeleton = proportionedRig("degenerate-source");
  const motion: IAutoMovieMotion = rootShiftClip(source.id, { x: 0, y: 0, z: 0.25 });
  const proportions: Parameters<typeof proportionedRig>[1] = { leg: 1.05, torso: 0.98 };

  const carried: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target: proportionedRig("degenerate-target", proportions),
    contacts: { enabled: false },
  });
  if (carried.motion === null) throw new Error("carried retarget failed");

  // 1. no legs at all: nothing to pin.
  const legless: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target: withoutBones(
      proportionedRig("legless-target", proportions),
      LEG_BONES,
    ),
  });
  TestValidator.equals("a legless target still retargets", legless.validation, {
    success: true,
  });
  if (legless.motion === null) throw new Error("legless retarget failed");
  TestValidator.equals(
    "a legless target leaves every pose untouched",
    legless.motion.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe["pose"]["joints"] => kf.pose.joints),
    [[], []],
  );

  // 2. zero-length thighs: the two-bone solve is degenerate.
  const collapsed: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target: withZeroLengthBones(
      proportionedRig("collapsed-target", proportions),
      ["leftLowerLeg", "rightLowerLeg"],
    ),
  });
  TestValidator.predicate(
    "a degenerate chain still reports its residual",
    validationHasWarning(
      "degenerate retarget contact",
      collapsed.validation,
      "physics",
      '$input.motion.keyframes[0].pose.joints["leftFoot"]',
    ),
  );
  if (collapsed.motion === null) throw new Error("collapsed retarget failed");
  TestValidator.equals(
    "a degenerate chain leaves the authored joints alone",
    collapsed.motion.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe["pose"]["joints"] => kf.pose.joints),
    [[], []],
  );
  // 3. immobile leg joints: every candidate clamps back to rest.
  const frozen: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target: withJointConstraint(
      proportionedRig("frozen-target", proportions),
      ["leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg"],
      IMMOBILE,
    ),
  });
  TestValidator.predicate(
    "both frozen feet report their residual",
    validationHasWarningCount("frozen retarget contacts", frozen.validation, 2),
  );
  if (frozen.motion === null) throw new Error("frozen retarget failed");
  TestValidator.equals(
    "an unimprovable correction is not applied",
    frozen.motion.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe["pose"]["joints"] => kf.pose.joints),
    [[], []],
  );
  TestValidator.predicate(
    "the frozen clip equals the verbatim copy in every keyframe pose",
    test12ValuesClose(frozen.motion.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe["pose"]["root"] => kf.pose.root), carried.motion.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe["pose"]["root"] => kf.pose.root)),
  );
}
