import {
  Quaternion,
  fitHingedRotationError,
  type IFitChainToTargetProps,
  indexSkeletonTopology,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  prepareChainPlant,
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
 * 4. A separate proximal X hinge with an immobile effector shows exactly
 *    0/30/0 degrees of error against identity when the same borrowed lower
 *    quaternion changes between calls. A nonfinite edit must fail twice,
 *    then a repaired finite30-degree record must score30 again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States degree/local/world frames, fixed preceding/rest rotations, lower and effector constraints, selected-pair ownership, mutable borrowed candidate scalars, repeated failure recovery and exact versus bounded-residual cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public withProjection with real skeleton clamps/projector, reads selected lower twist and its retained local/raw quaternions, and recomposes the actual shown world rotation. Public prepareChainPlant/fitHingedRotationError separately score edits of one proximal candidate record, repeated invalid edits and finite recovery. Wrong candidate pairing, identity-only memoization, failed admission treated as successful or forced-zero residual fails.
 * @evidence contracts/development/testing.md#independent-expectations Collinear Z rotations add their degree angles. The fixed 20+15 leaves the desired lower turn; the closed [-90,90] interval clips 120/-120 to 90/-90, leaving signed30-degree local requests and identity for the immobile effector. Half-angle sine/cosine constructs expectations directly. A separate proximal X hinge's fixed preceding/rest frames and effector are identity, so its shown world rotation is the lower candidate itself and its identity-demand geodesic error is exactly its0/30-degree turn, within1e-8-degree arithmetic roundoff.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers positive/negative reachable turns, both active lower endpoints, nonidentity preceding/rest frames, nonzero unreachable residual, changed requests, mutated prior result ownership, same-record scalar changes and repeated-invalid-to-valid recovery. Other entries own arbitrary coupled-joint projection and the bounded fallback's feasibility.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit owns isolated two/three-bone cardinal kernel rigs and source records. It starts no Human producer, native artifact, renderer, process or compiler and replaces no projector, clamp, foreign function or global.
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
      qclose(result.projection.quaternion, turn(0), 1e-12) &&
      result.projection.joint.bone === "leftHand" &&
      (result.projection.joint.flexion === null || result.projection.joint.flexion === 0) &&
      (result.projection.joint.abduction === null || result.projection.joint.abduction === 0) &&
      (result.projection.joint.twist === null || result.projection.joint.twist === 0) &&
      qclose(jointToQuaternionOnBasis(result.projection.joint, effectorBasis),
        result.projection.quaternion, 1e-12),
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
        result.projection.joint !== previous.projection.joint &&
        result.projection.local !== previous.projection.local &&
        result.projection.quaternion !== previous.projection.quaternion,
      );
    saved.push(result);
  }
  saved[0]!.joint.twist = 123;
  saved[0]!.projection.local.w = 456;
  saved[0]!.projection.quaternion.x = 789;
  saved[0]!.projection.joint.flexion = 123;
  TestValidator.predicate("earlier output mutation cannot alter the later same target",
    nclose(saved[4]!.joint.twist!, 45, 1e-8) &&
    qclose(saved[4]!.projection.local, turn(0), 1e-8) &&
    qclose(saved[4]!.projection.quaternion, turn(0), 1e-12),
  );
  proximalScalars();
}

/** Read each actual candidate quaternion and commit only successful lower admission. */
function proximalScalars(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal",
  }, "proximal candidate scalar basis");
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const skeleton: IAutoMovieSkeleton = { id: "proximal-candidate-scalars", bones: [
    { bone: "leftUpperArm", parent: null, axes: basis,
      constraint: { flexion: { min: -180, max: 180 }, abduction: { min: -180, max: 180 }, twist: { min: -180, max: 180 } },
      rest: { translation: { x: 0, y: 0, z: 0 }, rotation: { ...identity }, scale: { x: 1, y: 1, z: 1 } } },
    { bone: "leftLowerArm", parent: "leftUpperArm", axes: basis,
      constraint: { flexion: { min: 0, max: 90 }, abduction: null, twist: null },
      rest: { translation: { x: 0, y: 0, z: 1 }, rotation: { ...identity }, scale: { x: 1, y: 1, z: 1 } } },
    { bone: "leftHand", parent: "leftLowerArm", axes: basis,
      constraint: { flexion: null, abduction: null, twist: null },
      rest: { translation: { x: 0, y: 0, z: 1 }, rotation: { ...identity }, scale: { x: 1, y: 1, z: 1 } } },
  ] };
  const props: IFitChainToTargetProps = { skeleton,
    pose: { skeleton: skeleton.id, root: null, joints: [] },
    chain: { upper: "leftUpperArm", lower: "leftLowerArm", effector: "leftHand" },
    target: { x: 0, y: 0, z: 2 }, topology: indexSkeletonTopology(skeleton),
  };
  const prepared: ReturnType<typeof prepareChainPlant> = prepareChainPlant(props);
  TestValidator.predicate("the cardinal source is an actual connected three-bone chain", prepared !== null);
  if (prepared === null) throw new Error("cardinal proximal source preparation failed");
  const score: ReturnType<typeof fitHingedRotationError> = fitHingedRotationError(props, prepared, basis, identity);
  const lower: IAutoMovieQuaternion = { ...identity };
  for (const degrees of [0, 30, 0]) {
    const half: number = degrees * Math.PI / 360;
    lower.x = Math.sin(half);
    lower.w = Math.cos(half);
    const actual: number = score(identity, lower);
    TestValidator.predicate(`same lower record carries its actual current ${degrees}-degree residual`, nclose(actual, degrees, 1e-8));
  }
  lower.x = NaN;
  for (let attempt: number = 0; attempt < 2; attempt++) {
    let refused: boolean = false;
    try {
      score(identity, lower);
    } catch (error) {
      refused = error instanceof Error && error.message.includes("quaternion.x") && error.message.includes("finite");
    }
    TestValidator.predicate(`failed lower admission is not a successful reading on attempt${attempt}`, refused);
  }
  lower.x = Math.sin(Math.PI / 12);
  lower.w = Math.cos(Math.PI / 12);
  TestValidator.predicate("a repaired same-record candidate recovers its actual displayed residual", nclose(score(identity, lower), 30, 1e-8));
}

/** Construct the cardinal Z rotation directly from its half-angle formula. */
function turn(degrees: number): IAutoMovieQuaternion {
  const half: number = degrees * Math.PI / 360;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}
