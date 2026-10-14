import { sampleMotion } from "@automovie/engine";
import {
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

const DT: number = 0.1;
const N: number = 240;

/** Rebuild the unchanged 240-key linear ramp for each existing reader call; no timing benchmark is implied. */
const rampClip: () => IAutoMovieMotion = (): IAutoMovieMotion => {
  const frames: IAutoMovieKeyframe[] = [];
  for (let i: number = 0; i < N; ++i)
    frames.push(
      keyframe(
        i * DT,
        makePose([joint("leftLowerArm", { flexion: i })], {
          translation: { x: i, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    );
  return makeMotion(frames, (N - 1) * DT);
};

const flexionAt: (t: number) => number = (t: number): number => {
  const j: IAutoMovieJointPose | undefined = sampleMotion(
    rampClip(),
    t,
  ).pose.joints.find(
    (x: IAutoMovieJointPose): boolean => x.bone === "leftLowerArm",
  );
  if (j === undefined) throw new Error("leftLowerArm missing");
  return j.flexion ?? NaN;
};

const rootXAt: (t: number) => number = (t: number): number =>
  sampleMotion(rampClip(), t).pose.root?.translation.x ?? NaN;

/**
 * Observe sampled values across a 240-key linear ramp using a closed-form time/DT expectation. The current sampler delegates to logarithmic segmentIndex, but this functional unit neither counts key accesses nor benchmarks asymptotic performance; each existing reader reconstructs its fixture.
 *
 * Scenarios:
 *
 * 1. Dense segment midpoints, exact interior keys and off-grid queries preserve flexion and root X to 1e-9.
 * 2. Exact keys 137 and 200 retain their exact numeric values.
 * 3. Before-start and after-end clocks retain the exact first/last values.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples flexion and root translation throughout the unchanged ramp population, then checks exact interior and clamped endpoint values. This catches wrong segment placement or interpolation at queried times without claiming measured binary-search cost.
 * @evidence contracts/testing.md#independent-expectations Authored key i has angle and root X equal to i at i*0.1 seconds, so linear interpolation gives time/DT independently of sampleMotion and segmentIndex. Literal exact keys/endpoints retain zero tolerance through nclose eps=0; all dense sweep comparisons retain 1e-9.
 * @evidence contracts/testing.md#distinguishing-cases Retains all 239 segment midpoints, 238 interior key queries, three off-grid fractions, two exact-key assertions and both clamped ends. Because adjoining ramp segments share one line, these observations alone do not distinguish the internal earlier/later-segment tie; easing-specific units own that behavioral distinction.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every sample invocation through local readers and unchanged fixture constructors. No benchmark driver, process, viewer or native artifact is started, and helper calls register no separate tests.
 */
export function test_motion_sample_binary_search(): void {
  const last: number = (N - 1) * DT;

  // Dense interior sweep: midpoints, exact interior keys, and off-grid points.
  const queries: number[] = [];
  for (let i: number = 0; i < N - 1; ++i) queries.push((i + 0.5) * DT); // midpoints
  for (let i: number = 1; i < N - 1; ++i) queries.push(i * DT); // interior keys
  queries.push(last * 0.137, last * 0.611, last * 0.909); // off-grid

  for (const t of queries) {
    TestValidator.predicate(
      `flexion ramp is exact at t=${t.toFixed(4)}`,
      nclose(flexionAt(t), t / DT, 1e-9),
    );
    TestValidator.predicate(
      `root.x ramp is exact at t=${t.toFixed(4)}`,
      nclose(rootXAt(t), t / DT, 1e-9),
    );
  }

  // Endpoint tie: an exact interior key returns that key's value verbatim.
  TestValidator.predicate(
    "exact key 137 returns 137",
    nclose(flexionAt(137 * DT), 137, 0),
  );
  TestValidator.predicate(
    "exact key 200 returns 200",
    nclose(flexionAt(200 * DT), 200, 0),
  );

  // Clamped ends hold the first / last key.
  TestValidator.predicate(
    "clamp before start holds key 0",
    nclose(flexionAt(-1), 0, 0),
  );
  TestValidator.predicate(
    "clamp past end holds last key",
    nclose(flexionAt(last + 5), N - 1, 0),
  );
}
