import { sampleMotion } from "@automovie/engine";
import { IAutoMovieJointPose, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

const elbow: (m: IAutoMovieMotion, t: number) => number = (m: IAutoMovieMotion, t: number): number => {
  const j: IAutoMovieJointPose | undefined = sampleMotion(m, t).pose.joints.find(
    (x: IAutoMovieJointPose): boolean => x.bone === "leftLowerArm",
  );
  if (j === undefined)
    throw new Error("leftLowerArm missing from sampled pose");
  return j.flexion ?? 0;
};

/**
 * Observe held elbow values beyond both ends of a non-looping clip. This constrains numerical endpoint selection rather than full-pose identity or rendered playhead behavior.
 *
 * Scenarios:
 *
 * 1. On the unchanged 0-to-120-degree one-second clip, t=-0.5 retains 0 and t=2 retains 120.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the valid fixture before start and past end, then observes the leftLowerArm flexion through the product sample result, catching extrapolation beyond endpoint values.
 * @evidence contracts/testing.md#independent-expectations The existing fixture authors 0 and 120 at its two endpoints; literal expected values are independent of normalizeTime and interpolation. Original nclose tolerance remains, and the reader's missing-axis zero convention is retained rather than presented as a separate axis-presence assertion.
 * @evidence contracts/testing.md#distinguishing-cases Preserves negative -0.5 and later 2-second clocks on the same non-looping fixture. Loop wrap, exact-key ties, root interpolation and complete-pose ownership have separate owning tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both sample calls through its private elbow reader and existing fixture constructor. No helper registers cases or starts a viewer, process or native artifact.
 */
export function test_motion_sample_clamp(): void {
  const clip: IAutoMovieMotion = createValidMotion();
  TestValidator.predicate(
    "before start clamps to first",
    nclose(elbow(clip, -0.5), 0),
  );
  TestValidator.predicate(
    "after end clamps to last",
    nclose(elbow(clip, 2), 120),
  );
}
