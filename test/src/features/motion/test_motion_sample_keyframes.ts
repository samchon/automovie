import { sampleMotion } from "@automovie/engine";
import { IAutoMovieJointPose, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

const elbow: (m: IAutoMovieMotion, t: number) => number = (
  m: IAutoMovieMotion,
  t: number,
): number => {
  const j: IAutoMovieJointPose | undefined = sampleMotion(
    m,
    t,
  ).pose.joints.find(
    (x: IAutoMovieJointPose): boolean => x.bone === "leftLowerArm",
  );
  if (j === undefined)
    throw new Error("leftLowerArm missing from sampled pose");
  return j.flexion ?? 0;
};

/**
 * Observe endpoint and interior elbow samples on the unchanged linear one-second clip, plus carried skeleton identity. Numeric endpoint values are tested within the existing tolerance; full-pose identity is not asserted.
 *
 * Scenarios:
 *
 * 1. Elbow flexion 0-to-120 over one second gives 0/120 at the endpoints, 60 at 0.5 and 30 at 0.25, and the sampled pose names skeleton-1.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples both exact endpoints, two interior times and the midpoint skeleton id through sampleMotion, detecting wrong interpolation fraction, endpoint selection or rig identity.
 * @evidence contracts/testing.md#independent-expectations Local fixture endpoints 0/120 and linear fractions give literal 60/30 independently of sampleMotion; skeleton-1 is the unchanged fixture identity. The reader's null-axis-to-zero convention and original nclose tolerance are retained rather than claimed as axis-presence or exact-object checks.
 * @evidence contracts/testing.md#distinguishing-cases Retains endpoints versus midpoint/quarter progress on one non-looping linear fixture. Loop/clamp clocks, asymmetric axes, nonlinear easing and ownership are covered by their other existing units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all five sample calls through its private elbow reader and direct identity observation. Fixture helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_sample_keyframes(): void {
  const clip: IAutoMovieMotion = createValidMotion();
  TestValidator.predicate("at t=0 → 0°", nclose(elbow(clip, 0), 0));
  TestValidator.predicate("at t=1 → 120°", nclose(elbow(clip, 1), 120));
  TestValidator.predicate(
    "at t=0.5 → 60° (linear)",
    nclose(elbow(clip, 0.5), 60),
  );
  TestValidator.predicate("at t=0.25 → 30°", nclose(elbow(clip, 0.25), 30));
  TestValidator.equals(
    "sampled pose targets the skeleton",
    sampleMotion(clip, 0.5).pose.skeleton,
    "skeleton-1",
  );
}
