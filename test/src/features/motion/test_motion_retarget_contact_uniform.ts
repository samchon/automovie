import { retargetHumanoidMotion } from "@automovie/engine";
import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  nclose,
  validationHasNoWarnings,
  vclose,
} from "../internal/predicates";
import {
  keyframeWorld,
  mapped,
  proportionedRig,
  rootShiftClip,
} from "../internal/retargetRigs";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Observe a uniform factor-two fixture whose corrected and contact-disabled plain motion data remain exactly equal. This fixture-level no-op is distinct from a global binary64 theorem that all proportional scales commute exactly with FK.
 *
 * The contact owner skips fitting when drift is at most 1e-9 target model units. The existing clip equality and empty-joint observations require unchanged output for this admitted factor-two fixture, while its final FK comparison keeps the original vclose tolerance rather than asserting last-bit coordinate identity.
 *
 * Scenarios:
 *
 * 1. Both feet are in contact on every keyframe of the clip (the whole-clip
 *    contact boundary), so the pass has a pin on each frame and still changes
 *    nothing.
 * 2. The retarget with the pass on returns a clip deep-equal to the same retarget
 *    with `contacts.enabled === false`, and no joint is added to the poses the
 *    source left empty.
 * 3. The run succeeds without plausibility warnings, root scale is exactly two, and target left-foot positions meet the original vclose tolerance against mapped source contacts.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets with contact enabled and disabled, checks both source feet at both keys, compares complete motion records, observes empty output joints and warning-free success, and measures factor-two scale and mapped left-foot positions.
 * @evidence contracts/testing.md#independent-expectations Scaling every authored rest offset by two gives the declared proportional fixture and literal scale 2; source floor y=0.1 and empty joint arrays are independent literals. test12ValuesClose compares plain fields/array order/finite numeric leaves at eps0 without quaternion sign normalization, while vclose retains its existing coordinate tolerance. No prototype, NaN or signed-zero identity oracle is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Retains enabled/disabled correction, uniform leg/torso/arm factor two, both grounded feet/keys, exact unchanged clip data and left-foot mapped FK. Nonuniform proportions and unreachable contact have separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its two retarget calls and shared fixture-FK observations. Helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_uniform(): void {
  const source: IAutoMovieSkeleton = proportionedRig("uniform-source");
  const target: IAutoMovieSkeleton = proportionedRig("uniform-target", {
    leg: 2,
    torso: 2,
    arm: 2,
  });
  const motion: IAutoMovieMotion = rootShiftClip(source.id, {
    x: 0.4,
    y: 0,
    z: 0.25,
  });

  const pinned: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({ motion, source, target });
  const carried: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion,
      source,
      target,
      contacts: { enabled: false },
    });
  TestValidator.equals("uniform contact retarget succeeds", pinned.validation, {
    success: true,
  });
  if (pinned.motion === null || pinned.characterization === null)
    throw new Error("uniform contact retarget unexpectedly failed");
  if (carried.motion === null) throw new Error("carried retarget failed");

  // 1. every keyframe carries a contact on both feet.
  for (const index of [0, 1] as const)
    for (const slot of ["leftFoot", "rightFoot"] as const)
      TestValidator.predicate(
        `source ${slot} rests on the floor at keyframe ${index}`,
        nclose(keyframeWorld(source, motion, index, slot).y, 0.1),
      );

  // 2. all plain motion fields and finite numeric values remain equal.
  TestValidator.predicate(
    "a uniform scale makes the contact pass a no-op",
    test12ValuesClose(pinned.motion, carried.motion),
  );
  TestValidator.equals(
    "no joint is invented on a pose the source left empty",
    pinned.motion.keyframes.map(
      (kf: IAutoMovieKeyframe): number => kf.pose.joints.length,
    ),
    [0, 0],
  );

  // 3. no warning, and the feet sit exactly on the mapped contacts.
  TestValidator.predicate(
    "an exact retarget reports no plausibility warning",
    validationHasNoWarnings("exact uniform retarget", pinned.validation),
  );
  TestValidator.predicate(
    "root scale is exactly two",
    nclose(pinned.characterization.rootScale, 2, 0),
  );
  for (const index of [0, 1] as const)
    TestValidator.predicate(
      `left foot sits on the mapped contact at keyframe ${index}`,
      vclose(
        keyframeWorld(target, pinned.motion, index, "leftFoot"),
        mapped(keyframeWorld(source, motion, index, "leftFoot"), 2),
      ),
    );
}
