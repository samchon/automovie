import { gaitMotion } from "@automovie/engine";
import {
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../internal/predicates";

const GAIT: IAutoMovieGait = {
  name: "walk",
  period: 1,
  rootBob: { amplitude: 0.02, phase: 0, center: 0.01 },
  limbs: [
    { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 },
    { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 30 },
  ],
};

/** Compare nullable authored angles without introducing a tolerance where the original case required equal components. */
function sameAngle(
  a: number | null | undefined,
  b: number | null | undefined,
): boolean {
  return typeof a === "number" && typeof b === "number"
    ? nclose(a, b, 0)
    : a === b;
}

/** Compare every supported pose component in order; quaternion components use zero tolerance rather than sign-equivalent rotation. */
function samePose(a: IAutoMoviePose, b: IAutoMoviePose): boolean {
  if (a.skeleton !== b.skeleton || a.joints.length !== b.joints.length)
    return false;
  if (a.root === null || b.root === null) {
    if (a.root !== b.root) return false;
  } else if (
    !vclose(a.root.translation, b.root.translation, 0) ||
    !vclose(a.root.scale, b.root.scale, 0) ||
    !vclose(a.root.rotation, b.root.rotation, 0) ||
    !nclose(a.root.rotation.w, b.root.rotation.w, 0)
  )
    return false;
  return a.joints.every(
    (joint: IAutoMovieJointPose, index: number): boolean => {
      const expected: IAutoMovieJointPose = b.joints[index];
      return (
        joint.bone === expected.bone &&
        sameAngle(joint.flexion, expected.flexion) &&
        sameAngle(joint.abduction, expected.abduction) &&
        sameAngle(joint.twist, expected.twist)
      );
    },
  );
}

/** Observe cycle metadata independently of pose arithmetic, retaining the original exact seed expectation. */
function sameCycle(
  a: IAutoMovieMotion["gaitCycle"],
  b: IAutoMovieMotion["gaitCycle"],
): boolean {
  if (a === undefined || a === null || b === undefined || b === null)
    return a === b;
  return nclose(a.period, b.period, 0) && nclose(a.phaseAt, b.phaseAt, 0);
}

/** Compare the gait producer's complete supported clip fields with exact numeric predicates; its keyframes carry neutral expression and linear non-Bezier interpolation. */
function sameGaitClip(a: IAutoMovieMotion, b: IAutoMovieMotion): boolean {
  return (
    a.id === b.id &&
    a.skeleton === b.skeleton &&
    a.loop === b.loop &&
    nclose(a.duration, b.duration, 0) &&
    sameCycle(a.gaitCycle, b.gaitCycle) &&
    a.keyframes.length === b.keyframes.length &&
    a.keyframes.every((frame: IAutoMovieKeyframe, index: number): boolean => {
      const expected: IAutoMovieKeyframe = b.keyframes[index];
      return (
        nclose(frame.time, expected.time, 0) &&
        samePose(frame.pose, expected.pose) &&
        frame.easing === expected.easing &&
        frame.expression === null &&
        expected.expression === null &&
        frame.bezier === null &&
        expected.bezier === null
      );
    })
  );
}

/**
 * Pin gait phase offset: a local-time keyframe samples the cycle at time plus phase, while local timestamps remain unchanged and cycle metadata carries the opening seed.
 *
 * Scenarios (period one, four intervals at times 0, .25, .5, .75, 1):
 *
 * 1. A quarter-period phase rotates each pose by one sample, including root bob, while local times stay unchanged; metadata preserves normalized, negative and underflow seeds.
 * 2. The phased closing pose repeats its first pose.
 * 3. Omitting the phase is zero phase, with identical supported clip fields.
 * 4. A whole-period phase wraps back to the unphased cycle.
 * 5. A non-finite phase throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Compares phase-shifted poses against the next unshifted sample while retaining local times, then checks explicit cycle seeds, negative/underflow wrapping, loop closure and omitted/whole-cycle equivalence; a NaN seed must refuse with the expected message.
 * @evidence contracts/testing.md#independent-expectations A quarter of the authored one-second cycle is one of four sample intervals, supplying the shift relation without copying amplitudes from production. Literal cycle seeds independently check metadata; related-output pose comparisons can share a common synthesis defect, so limb-law tests own absolute angle behavior. Zero-tolerance nclose/vclose preserve exact component expectations rather than treating antipodal quaternions as equal.
 * @evidence contracts/testing.md#distinguishing-cases Preserves quarter-period and exact 0.4 seeds, negative -0.6 and negative-underflow wrapping, closing poses, omitted/explicit zero, whole-period wrapping and NaN refusal. Sample-count/period admission and absolute limb/root-bob values belong to their owning gait units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every direct gaitMotion call. Local comparison helpers examine supported clip, pose and metadata fields without registering cases, starting a renderer or reading an encoded artifact; no byte-file identity is claimed.
 */
export function test_motion_gait_phase(): void {
  const plain: ReturnType<typeof gaitMotion> = gaitMotion("g", "sk", GAIT, 4);
  const phased: ReturnType<typeof gaitMotion> = gaitMotion(
    "g",
    "sk",
    GAIT,
    4,
    0.25,
  );

  // 1. rotation by one sample step.
  for (let i: number = 0; i + 1 < plain.keyframes.length; ++i) {
    TestValidator.predicate(
      `phased keyframe ${i} pose equals unphased keyframe ${i + 1}`,
      samePose(phased.keyframes[i]!.pose, plain.keyframes[i + 1]!.pose),
    );
    TestValidator.predicate(
      `phased keyframe ${i} keeps its local time`,
      nclose(phased.keyframes[i]!.time, plain.keyframes[i]!.time, 0),
    );
  }

  // 1b. the cycle meta records the seed so the NEXT beat's end-state computes
  // the true stride position: phase(t) = (phaseAt + t) % period.
  TestValidator.predicate(
    "the phased clip stamps its phase into gaitCycle.phaseAt",
    sameCycle(phased.gaitCycle, { period: 1, phaseAt: 0.25 }),
  );
  const exactPhase: ReturnType<typeof gaitMotion> = gaitMotion(
    "g",
    "sk",
    GAIT,
    4,
    0.4,
  );
  TestValidator.predicate(
    "an already normalized phase keeps its exact identity",
    sameCycle(exactPhase.gaitCycle, { period: 1, phaseAt: 0.4 }),
  );
  TestValidator.predicate(
    "a whole-cycle sample keeps the exact opening pose",
    samePose(
      exactPhase.keyframes[exactPhase.keyframes.length - 1]!.pose,
      exactPhase.keyframes[0]!.pose,
    ),
  );
  TestValidator.predicate(
    "a negative phase still wraps into the positive cycle",
    sameCycle(gaitMotion("g", "sk", GAIT, 4, -0.6).gaitCycle, {
      period: 1,
      phaseAt: 0.4,
    }),
  );
  TestValidator.predicate(
    "a negative underflow wraps to the cycle opening",
    sameCycle(gaitMotion("g", "sk", GAIT, 4, -Number.MIN_VALUE).gaitCycle, {
      period: 1,
      phaseAt: 0,
    }),
  );

  // 2. still a seamless loop.
  TestValidator.predicate(
    "the phased closing keyframe repeats its first",
    samePose(
      phased.keyframes[phased.keyframes.length - 1]!.pose,
      phased.keyframes[0]!.pose,
    ),
  );

  // 3. omitted phase is the zero phase.
  TestValidator.predicate(
    "an omitted phase is the zero phase",
    sameGaitClip(
      gaitMotion("g", "sk", GAIT, 4),
      gaitMotion("g", "sk", GAIT, 4, 0),
    ),
  );

  // 4. a whole period wraps around.
  TestValidator.predicate(
    "a whole-period phase wraps to the unphased cycle",
    sameGaitClip(gaitMotion("g", "sk", GAIT, 4, GAIT.period), plain),
  );

  // 5. refusal.
  TestValidator.predicate(
    "a non-finite phase throws",
    throwsError(
      (): ReturnType<typeof gaitMotion> =>
        gaitMotion("g", "sk", GAIT, 4, Number.NaN),
      ["gait phase must be finite"],
    ),
  );
}
