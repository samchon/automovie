import { retargetHumanoidMotion } from "@automovie/engine";
import { IAutoMovieJointConstraint, IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";
import {
  keyframeWorld,
  mapped,
  proportionedRig,
  rootShiftClip,
  withJointConstraint,
} from "../internal/retargetRigs";

/** A hip gamut wide enough to fold a 1.5x leg under the mapped contact. */
const WIDE_HIP: IAutoMovieJointConstraint = {
  flexion: { min: -150, max: 150 },
  abduction: { min: -90, max: 90 },
  twist: { min: -90, max: 90 },
  swingDeg: 180,
};

/**
 * Observe mapped foot contact on a synthetic nonproportional rig with explicitly widened target hip constraints, against the same retarget with contact correction disabled. This measures authored-key FK positions, not rendered motion or continuous-time ground contact.
 *
 * The target uses legs 1.5 times and torso 0.9 times the source offsets, with explicit wide hips under target-override-then-default-humanoid precedence. The disabled twin supplies the unchanged angle-copy comparison rather than a claim about rendered sliding.
 *
 * Scenarios:
 *
 * 1. The source rest pose is the hand-checkable oracle every other number is
 *    derived from: the left ankle sits at (0.1, 0.1, 0.1), and the root shift
 *    carries it to (0.1, 0.1, 0.35) on the second keyframe.
 * 2. Retargeted onto a legs-1.5x / torso-0.9x rig with the pass on, both feet land
 *    within 0.005 of `rootScale` times those source contacts on both keyframes,
 *    and the run reports no plausibility warning.
 * 3. The negative twin: the same retarget with `contacts.enabled === false`
 *    reproduces the v1 slide: the left foot misses its mapped contact by more
 *    than 0.5, the hand-derived distance between the target's own rest ankle
 *    and the mapped contact.
 * 4. The characterization names which policy ran, and the corrected clip keeps the
 *    authored keyframe count and times rather than re-keying onto a clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks hand-authored source ankle coordinates, retargets with correction enabled/disabled, measures both corrected feet at both authored keys and the disabled left-foot miss, then observes scale, policy labels and unchanged exact key times.
 * @evidence contracts/testing.md#independent-expectations Fixture offsets give source ankle (0.1,0.1,0.1), shifted z=0.35 and rest heights 1.65/2.025, hence the independent scale ratio. Componentwise mapped source FK supplies the existing contact target while shared FK remains a consumer, not a separate geometry oracle. Original 1e-12 scale, 5e-3 contact and 0.5 negative-twin thresholds remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Retains 1.5 leg/0.9 torso proportions with explicit wide hips, both feet and keyframes, enabled versus disabled correction, policy labels and exact [0,1] clock. Default-ROM residual, airborne frames and hand declarations belong to separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both retarget calls and fixture FK observations. Existing shared fixture/mapping helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_proportions(): void {
  const source: IAutoMovieSkeleton = proportionedRig("contact-source");
  const target: IAutoMovieSkeleton = withJointConstraint(
    proportionedRig("leggy-target", { leg: 1.5, torso: 0.9 }),
    ["leftUpperLeg", "rightUpperLeg"],
    WIDE_HIP,
  );
  const motion: IAutoMovieMotion = rootShiftClip(source.id, { x: 0, y: 0, z: 0.25 });

  // 1. the source contacts, straight off the rest offsets.
  TestValidator.predicate(
    "source left ankle rests on the rig floor",
    vclose(keyframeWorld(source, motion, 0, "leftFoot"), {
      x: 0.1,
      y: 0.1,
      z: 0.1,
    }),
  );
  TestValidator.predicate(
    "source left ankle travels with the root",
    vclose(keyframeWorld(source, motion, 1, "leftFoot"), {
      x: 0.1,
      y: 0.1,
      z: 0.35,
    }),
  );

  // 2. the pass holds both feet on the mapped contacts.
  const pinned: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion, source, target });
  TestValidator.equals("contact retarget succeeds", pinned.validation, {
    success: true,
  });
  if (pinned.motion === null || pinned.characterization === null)
    throw new Error("contact retarget unexpectedly failed");

  const scale: number = pinned.characterization.rootScale;
  TestValidator.predicate(
    "root scale is target height 2.025 over source height 1.65",
    nclose(scale, 2.025 / 1.65, 1e-12),
  );
  for (const slot of ["leftFoot", "rightFoot"] as const)
    for (const index of [0, 1] as const)
      TestValidator.predicate(
        `${slot} holds the mapped contact on keyframe ${index}`,
        vclose(
          keyframeWorld(target, pinned.motion, index, slot),
          mapped(keyframeWorld(source, motion, index, slot), scale),
          5e-3,
        ),
      );

  // 3. the negative twin: the pass off reproduces the v1 slide.
  const carried: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target,
    contacts: { enabled: false },
  });
  if (carried.motion === null || carried.characterization === null)
    throw new Error("carried retarget unexpectedly failed");
  for (const index of [0, 1] as const)
    TestValidator.predicate(
      `carrying angles verbatim slides the left foot on keyframe ${index}`,
      vclose(
        keyframeWorld(target, carried.motion, index, "leftFoot"),
        mapped(keyframeWorld(source, motion, index, "leftFoot"), scale),
        0.5,
      ) === false,
    );

  // 4. the policy is recorded and the keyframes are untouched.
  TestValidator.equals(
    "pinning is the default contact policy",
    pinned.characterization.contactPolicy,
    "pin-source-contacts",
  );
  TestValidator.equals(
    "disabling the pass records the v1 policy",
    carried.characterization.contactPolicy,
    "carry-joint-angles",
  );
  TestValidator.predicate(
    "the corrected clip keeps the authored keyframe times",
    pinned.motion.keyframes.length === 2 && nclose(pinned.motion.keyframes[0]!.time, 0, 0) && nclose(pinned.motion.keyframes[1]!.time, 1, 0),
  );
}
