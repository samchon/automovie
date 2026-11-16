import {
  Quaternion,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  solveDistalTwist,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * A distal solve's retained effector projection belongs to its selected lower
 * joint, including targets the actual lower/effector ROM cannot reach.
 *
 * Scenarios:
 * 1. A Z20 preceding frame and Z15 fixed effector rest require lower twists
 *    45 and -30 for the requested Z80 and Z5 world orientations. An immobile
 *    effector contributes identity, so the achieved world request is exact.
 * 2. Desired lower twists 120 and -120 exceed the [-90,90] range. The
 *    selected endpoint retains its actual local 30-degree excess and the
 *    recomposed world orientation remains 30 degrees short of the demand.
 * 3. A/B/C/A targets and caller mutation of an earlier returned joint and
 *    projection cannot alter a later result or an independently returned one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States degree/local/world frames, fixed preceding/rest rotations, lower and effector constraints, selected-pair ownership and exact versus bounded-residual cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public withProjection with real skeleton clamps/projector, reads selected lower twist and its retained local/raw quaternions, and recomposes the actual shown world rotation. A wrong candidate-projection pairing or forced-zero unreachable residual fails independent orientation/angle checks.
 * @evidence contracts/development/testing.md#independent-expectations Collinear Z rotations add their degree angles. The fixed 20+15 leaves the desired lower turn; the closed [-90,90] interval clips 120/-120 to 90/-90, leaving signed 30-degree local requests and an identity articulation for the immobile effector. Half-angle sine/cosine constructs these expectations directly.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers positive/negative reachable turns, both active lower endpoints, nonidentity preceding/rest frames, nonzero unreachable residual, changed requests and mutated prior result ownership. Other entries own arbitrary coupled-joint projection and the bounded fallback's feasibility.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit owns its two-bone cardinal rig and source records. It starts no Human producer, native artifact, renderer, process or compiler and replaces no projector, clamp, foreign function or global.
 */
export function test_motion_distal_twist_paired_projection(): void {
  const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    twistPlacement: "distal",
  }, "paired distal lower basis");
  const effectorBasis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  }, "paired distal effector basis");
  const lowerConstraint: IAutoMovieJointConstraint = {
    flexion: { min: 0, max: 0 }, abduction: null, twist: { min: -90, max: 90 },
  };
  const effectorConstraint: IAutoMovieJointConstraint = {
    flexion: null, abduction: null, twist: null,
  };
  const skeleton: IAutoMovieSkeleton = {
    id: "paired-distal-rig",
    bones: [
      { bone: "leftLowerArm", parent: null, axes: lowerBasis, constraint: lowerConstraint,
        rest: { translation: { x: 0, y: 0, z: 0 }, rotation: turn(0), scale: { x: 1, y: 1, z: 1 } } },
      { bone: "leftHand", parent: "leftLowerArm", axes: effectorBasis, constraint: effectorConstraint,
        rest: { translation: { x: 0, y: 0, z: 1 }, rotation: turn(15), scale: { x: 1, y: 1, z: 1 } } },
    ],
  };
  const fixed: solveDistalTwist.IPrepared = solveDistalTwist.prepare({
    effectorRest: turn(15), effectorBasis, effectorFrame: undefined,
  });
  const saved: solveDistalTwist.IResult[] = [];
  for (const [desired, expected] of [[45, 45], [120, 90], [-120, -90], [-30, -30], [45, 45]] as const) {
    const result: solveDistalTwist.IResult = solveDistalTwist.withProjection({
      joint: joint("leftLowerArm", { flexion: 0, abduction: 0, twist: 0 }),
      effector: joint("leftHand", { flexion: 0, abduction: 0, twist: 0 }),
      above: turn(20), lowerBasis, lowerFrame: undefined,
      effectorRest: turn(15), effectorBasis, effectorFrame: undefined,
      rotation: turn(35 + desired), skeleton, preparedEffector: fixed,
    });
    TestValidator.predicate("selected lower turn obeys actual ROM",
      nclose(result.joint.twist!, expected, 1e-8) &&
      result.joint.twist! >= -90 && result.joint.twist! <= 90,
    );
    TestValidator.predicate("retained projection belongs to the selected candidate",
      qclose(result.projection.local, turn(desired - expected), 1e-8) &&
      qclose(result.projection.quaternion, turn(0), 1e-12),
    );
    const lower: IAutoMovieQuaternion = jointToQuaternionOnBasis(result.joint, lowerBasis);
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(Quaternion.multiply(turn(20), lower), turn(15)),
      result.projection.quaternion,
    );
    TestValidator.predicate("actual shown world orientation preserves the known residual",
      qclose(shown, turn(35 + expected), 1e-8) &&
      nclose(Quaternion.angle(shown, turn(35 + desired)) * 180 / Math.PI,
        Math.abs(desired - expected), 1e-6),
    );
    for (const previous of saved)
      TestValidator.predicate("each query owns a fresh selected pair",
        result !== previous && result.joint !== previous.joint &&
        result.projection !== previous.projection &&
        result.projection.local !== previous.projection.local &&
        result.projection.quaternion !== previous.projection.quaternion,
      );
    saved.push(result);
  }
  saved[0]!.joint.twist = 123;
  saved[0]!.projection.local.w = 456;
  saved[0]!.projection.quaternion.x = 789;
  TestValidator.predicate("earlier output mutation cannot alter the later same target",
    nclose(saved[4]!.joint.twist!, 45, 1e-8) &&
    qclose(saved[4]!.projection.local, turn(0), 1e-8) &&
    qclose(saved[4]!.projection.quaternion, turn(0), 1e-12),
  );
}

/** Construct the cardinal Z rotation directly from its half-angle formula. */
function turn(degrees: number): IAutoMovieQuaternion {
  const half: number = degrees * Math.PI / 360;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}
