import { sampleMotion } from "@automovie/engine";
import { IAutoMovieJointPose, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
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
 * Observe modulo time wrapping beyond one and two durations. The unchanged ramp is not seam-closed, so this test does not establish seamless pose continuity or rendered looping.
 *
 * Scenarios:
 *
 * 1. On the one-second 0-to-120 elbow ramp, t=1.5 wraps to 0.5 for 60 and t=2.25 wraps to 0.25 for 30.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the authored looping motion at two later clocks and observes elbow flexion, distinguishing modulo replay from non-looping end clamp.
 * @evidence contracts/testing.md#independent-expectations Remainders 1.5 modulo 1=0.5 and 2.25 modulo 1=0.25 determine literal linear values 60/30 independently of normalizeTime. Original nclose tolerance and null-axis-to-zero reader behavior remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Retains one-cycle and two-cycle overflow clocks on the same looping fixture. Exact duration ties, negative clocks, seam closure and malformed duration have separate existing owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both sample calls through its local elbow reader and existing fixture constructors. No helper registers cases or starts a viewer, process or native artifact.
 */
export function test_motion_sample_loop(): void {
  const looped: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
    true,
  );
  TestValidator.predicate(
    "1.5 wraps to 0.5 → 60°",
    nclose(elbow(looped, 1.5), 60),
  );
  TestValidator.predicate(
    "2.25 wraps to 0.25 → 30°",
    nclose(elbow(looped, 2.25), 30),
  );
}
