import { sampleMotion } from "@automovie/engine";
import {
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const shift: (x: number) => IAutoMovieTransform = (
  x: number,
): IAutoMovieTransform => ({
  translation: { x, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Observe asymmetric clinical-axis and root interpolation, plus the retained preset identity of a one-sided expression. Missing numeric axes interpolate from zero and missing roots from identity; only the preset is asserted for expressions, whose current intensity ramps through neutral rather than carrying the whole expression unchanged.
 *
 * Scenarios (forward clip, sampled at t=0.5):
 *
 * 1. Flexion present on both keyframes (0→120) → 60.
 * 2. Abduction absent at the start, 10 at the end → 5 (missing treated as 0).
 * 3. Twist 5 at the start, absent at the end → 2.5 (missing treated as 0).
 * 4. Root absent at the start, +1 at the end → +0.5 (missing treated as identity).
 * 5. Expression present at the start and absent at the end retains the start preset name; intensity is not asserted here.
 *
 * The unchanged reversed clip observes root present-to-absent midpoint 1 from shift(2) and the end expression preset, while the both-roots-present clip observes midpoint 1 from shifts 0/2. The axis-swap twin observes start-only abduction and end-only twist.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampleMotion on four authored two-stop clips and checks flexion/abduction/twist midpoint values, root presence and X midpoints, and happy/angry preset identity for opposite one-sided expressions.
 * @evidence contracts/testing.md#independent-expectations Linear half progress gives the literal 60, 5, 2.5, 0.5, 1, 4 and 3 from unchanged authored endpoints and neutral zero/identity conventions. Preset names are authored literals, not extracted expectations; expression intensity/channel behavior is not inferred from name agreement and belongs to the expression units.
 * @evidence contracts/testing.md#distinguishing-cases Retains both-present axes, each missing-side axis direction, missing-start/missing-end/both-present roots and both expression directions at t=0.5. Null-null values, loop/clamp clocks and complete expression blends have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns four direct sample calls with existing in-memory fixture constructors. Private shift and predicate readers register no cases and start no viewer, process or native artifact.
 */
export function test_motion_sample_asymmetric(): void {
  const forward: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerArm", { flexion: 0, twist: 5 })]),
        "linear",
        makeExpression("happy", 1),
      ),
      keyframe(
        1,
        makePose(
          [joint("leftLowerArm", { flexion: 120, abduction: 10 })],
          shift(1),
        ),
        "linear",
        null,
      ),
    ],
    1,
  );
  const f: ReturnType<typeof sampleMotion> = sampleMotion(forward, 0.5);
  const fj: IAutoMovieJointPose = f.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftLowerArm",
  )!;
  TestValidator.predicate(
    "flexion both-present → 60",
    nclose(fj.flexion ?? NaN, 60),
  );
  TestValidator.predicate(
    "abduction absent→10 → 5",
    nclose(fj.abduction ?? NaN, 5),
  );
  TestValidator.predicate("twist 5→absent → 2.5", nclose(fj.twist ?? NaN, 2.5));
  TestValidator.equals(
    "root absent→present → 0.5",
    namedFacts([
      ["fPoseRoot", (): boolean => f.pose.root !== null],
      [
        "ncloseFPose",
        (): boolean =>
          f.pose.root !== null && nclose(f.pose.root.translation.x, 0.5),
      ],
    ]),
    { fPoseRoot: true, ncloseFPose: true },
  );
  TestValidator.equals(
    "expression present→absent carries first",
    f.expression?.preset,
    "happy",
  );

  const reversed: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerArm", { flexion: 120 })], shift(2)),
        "linear",
        null,
      ),
      keyframe(
        1,
        makePose([joint("leftLowerArm", { flexion: 0 })]),
        "linear",
        makeExpression("angry", 1),
      ),
    ],
    1,
  );
  const r: ReturnType<typeof sampleMotion> = sampleMotion(reversed, 0.5);
  TestValidator.equals(
    "root present→absent → 1.0",
    namedFacts([
      ["rPoseRoot", (): boolean => r.pose.root !== null],
      [
        "ncloseRPose",
        (): boolean =>
          r.pose.root !== null && nclose(r.pose.root.translation.x, 1),
      ],
    ]),
    { rPoseRoot: true, ncloseRPose: true },
  );
  TestValidator.equals(
    "expression absent→present carries second",
    r.expression?.preset,
    "angry",
  );

  const bothRoots: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerArm", { flexion: 0 })], shift(0)),
        "linear",
        null,
      ),
      keyframe(
        1,
        makePose([joint("leftLowerArm", { flexion: 0 })], shift(2)),
        "linear",
        null,
      ),
    ],
    1,
  );
  const b: ReturnType<typeof sampleMotion> = sampleMotion(bothRoots, 0.5);
  TestValidator.equals(
    "both roots present → midpoint 1.0",
    namedFacts([
      ["bPoseRoot", (): boolean => b.pose.root !== null],
      [
        "ncloseBPose",
        (): boolean =>
          b.pose.root !== null && nclose(b.pose.root.translation.x, 1),
      ],
    ]),
    { bPoseRoot: true, ncloseBPose: true },
  );

  // axes present on opposite keyframes: abduction only at the start, twist only
  // at the end (mirrors scenarios 2–3 onto the other side of each blend).
  const axisSwap: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { abduction: 8 })])),
      keyframe(1, makePose([joint("leftLowerArm", { twist: 6 })])),
    ],
    1,
  );
  const a: ReturnType<typeof sampleMotion> = sampleMotion(axisSwap, 0.5);
  const aj: IAutoMovieJointPose = a.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftLowerArm",
  )!;
  TestValidator.predicate(
    "start-only abduction 8→absent → 4",
    nclose(aj.abduction ?? NaN, 4),
  );
  TestValidator.predicate(
    "end-only twist absent→6 → 3",
    nclose(aj.twist ?? NaN, 3),
  );
}
