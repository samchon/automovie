import {
  IAutoMoviePlantChain,
  fitChainToTarget,
  indexSkeletonTopology,
  jointToQuaternion,
  resolvePose,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const transform: (translation: IAutoMovieVector3) => IAutoMovieTransform = (
  translation: IAutoMovieVector3,
): IAutoMovieTransform => ({
  translation,
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const BALL: IAutoMovieJointConstraint = {
  flexion: { min: -180, max: 180 },
  abduction: { min: -180, max: 180 },
  twist: { min: -180, max: 180 },
  swingDeg: 180,
};
const HINGE: IAutoMovieJointConstraint = {
  flexion: { min: -180, max: 180 },
  abduction: null,
  twist: null,
};
const CHAIN: IAutoMoviePlantChain = {
  effector: "leftFoot",
  upper: "leftUpperLeg",
  lower: "leftLowerLeg",
};

const skeleton: (
  id: string,
  lower: IAutoMovieVector3,
  foot: IAutoMovieVector3,
) => IAutoMovieSkeleton = (
  id: string,
  lower: IAutoMovieVector3,
  foot: IAutoMovieVector3,
): IAutoMovieSkeleton => ({
  id,
  bones: [
    {
      bone: "hips",
      parent: null,
      rest: transform({ x: 0, y: 0, z: 0 }),
      constraint: null,
    },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: transform({ x: 0, y: 0, z: 0 }),
      constraint: BALL,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: transform(lower),
      constraint: HINGE,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: transform(foot),
      constraint: null,
    },
  ],
});

const distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const rotationDistance: (
  pose: IAutoMoviePose,
  reference: IAutoMoviePose,
) => number = (pose: IAutoMoviePose, reference: IAutoMoviePose): number => {
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    pose.joints.map(
      (
        joint: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [joint.bone, joint],
    ),
  );
  return reference.joints.reduce(
    (total: number, prior: IAutoMovieJointPose): number => {
      const candidate: IAutoMovieQuaternion = jointToQuaternion(
        joints.get(prior.bone) ?? {
          bone: prior.bone,
          flexion: null,
          abduction: null,
          twist: null,
        },
      );
      const expected: IAutoMovieQuaternion = jointToQuaternion(prior);
      const dot: number = Math.min(
        1,
        Math.abs(
          candidate.x * expected.x +
            candidate.y * expected.y +
            candidate.z * expected.z +
            candidate.w * expected.w,
        ),
      );
      const angle: number = 2 * Math.acos(dot);
      return total + angle * angle;
    },
    0,
  );
};

/**
 * Observe finite, residual-improving chain fitting for parallel hinge/reach axes, then prior-pose branch selection for an authored exact target. Numerical FK and quaternion-distance observations constrain these declared fixtures; they do not prove global IK optimality or rendered motion.
 *
 * Scenarios:
 *
 * 1. A rig reaches along +X with the default +X lower flexion axis, taking the
 *    first orthogonal fallback.
 * 2. A rig reaches down with a custom world-down flexion axis, taking both
 *    fallbacks before +Z supplies the basis. Its mirrored/non-neutral rest
 *    frame also exercises selected clinical angles through the same rig tables used by FK; the asserted result is finite improvement rather than exact contact in this case.
 * 3. Two exact mirrored pins use quaternion geodesic continuity to select the
 *    branch matching the prior corrected pose instead of the first pole.
 * 4. An authored pose already exact on the opposite branch still yields to the
 *    equal-residual prior branch rather than triggering an authored early
 *    exit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls fitChainToTarget on two parallel-axis fixtures and requires finite changed output with strictly improved target residual, then compares prior-reference and default-pole solutions and the authored-exact twin through FK and squared quaternion geodesic distance.
 * @evidence contracts/testing.md#independent-expectations Two unit-length segments can reach the literal 1.5-metre target with half-bend acos(0.75), yielding the authored mirrored reference independently of candidate search. Math.hypot measures positional residual and the sign-insensitive quaternion dot formula measures branch distance; jointToQuaternion and FK remain shared consumers. Original 1e-9 improvement, 1e-7 position and 1e-12 squared-angle limits are preserved.
 * @evidence contracts/testing.md#distinguishing-cases Retains horizontal default-axis and vertical custom-axis/rest-frame fallback fixtures, default pole versus prior reference, and an already-exact opposite authored pose. The first pair requires improvement rather than a zero residual; broad constrained/unreachable behavior has separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all fits and FK observations with local rigs and authored poses. Private fixture and distance helpers register no extra cases and start no viewer, renderer or native artifact.
 */
export function test_motion_plant_bend_basis(): void {
  const cases: ReadonlyArray<
    Pick<
      Parameters<typeof fitChainToTarget>[0],
      "skeleton" | "target" | "jointAxes" | "restFrames"
    >
  > = [
    {
      skeleton: skeleton(
        "parallel-horizontal",
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
      target: { x: 1, y: 0, z: 0 },
      jointAxes: undefined,
      restFrames: undefined,
    },
    {
      skeleton: skeleton(
        "parallel-vertical",
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ),
      target: { x: 0, y: -1, z: 0 },
      jointAxes: {
        leftLowerLeg: {
          flexion: { x: 0, y: -1, z: 0 },
          abduction: { x: 0, y: 0, z: 1 },
          twist: { x: -1, y: 0, z: 0 },
        },
      },
      restFrames: {
        leftLowerLeg: { flexion: { sign: -1 as const, neutral: 20 } },
      },
    },
  ] as const;

  for (const entry of cases) {
    const pose: IAutoMoviePose = {
      skeleton: entry.skeleton.id,
      root: transform({ x: 0, y: 0, z: 0 }),
      joints: [],
    };
    const topology: ReturnType<typeof indexSkeletonTopology> =
      indexSkeletonTopology(entry.skeleton);
    const position: (candidate: IAutoMoviePose) => IAutoMovieVector3 = (
      candidate: IAutoMoviePose,
    ): IAutoMovieVector3 =>
      resolvePose(
        candidate,
        entry.skeleton,
        entry.jointAxes,
        entry.restFrames,
        topology,
      ).find(
        (bone: ReturnType<typeof resolvePose>[number]): boolean =>
          bone.bone === CHAIN.effector,
      )!.worldPosition;
    const before: number = distance(position(pose), entry.target);
    const fitted: IAutoMoviePose = fitChainToTarget({
      skeleton: entry.skeleton,
      pose,
      chain: CHAIN,
      target: entry.target,
      topology,
      jointAxes: entry.jointAxes,
      restFrames: entry.restFrames,
    });
    const afterPosition: IAutoMovieVector3 = position(fitted);
    const after: number = distance(afterPosition, entry.target);
    TestValidator.equals(
      `${entry.skeleton.id} bend basis stays finite and non-destructive`,
      namedFacts([
        [
          "isFiniteAfterPositionX",
          (): boolean => Number.isFinite(afterPosition.x),
        ],
        [
          "isFiniteAfterPositionY",
          (): boolean => Number.isFinite(afterPosition.y),
        ],
        [
          "isFiniteAfterPositionZ",
          (): boolean => Number.isFinite(afterPosition.z),
        ],
        ["fittedPose", (): boolean => fitted !== pose],
        ["afterBeforeE", (): boolean => after < before - 1e-9],
      ]),
      {
        isFiniteAfterPositionX: true,
        isFiniteAfterPositionY: true,
        isFiniteAfterPositionZ: true,
        fittedPose: true,
        afterBeforeE: true,
      },
    );
  }

  const exactSkeleton: IAutoMovieSkeleton = skeleton(
    "exact-continuity",
    { x: 0, y: -1, z: 0 },
    { x: 0, y: -1, z: 0 },
  );
  const exactPose: IAutoMoviePose = {
    skeleton: exactSkeleton.id,
    root: transform({ x: 0, y: 0, z: 0 }),
    joints: [],
  };
  const halfBend: number = (Math.acos(0.75) * 180) / Math.PI;
  const reference: IAutoMoviePose = {
    ...exactPose,
    joints: [
      {
        bone: CHAIN.upper,
        flexion: halfBend,
        abduction: 0,
        twist: 0,
      },
      {
        bone: CHAIN.lower,
        flexion: -2 * halfBend,
        abduction: null,
        twist: null,
      },
    ],
  };
  const exactTarget: IAutoMovieVector3 = { x: 0, y: -1.5, z: 0 };
  const exactTopology: ReturnType<typeof indexSkeletonTopology> =
    indexSkeletonTopology(exactSkeleton);
  const pole: IAutoMoviePose = fitChainToTarget({
    skeleton: exactSkeleton,
    pose: exactPose,
    chain: CHAIN,
    target: exactTarget,
    topology: exactTopology,
  });
  const continuous: IAutoMoviePose = fitChainToTarget({
    skeleton: exactSkeleton,
    pose: exactPose,
    chain: CHAIN,
    target: exactTarget,
    topology: exactTopology,
    referencePose: reference,
  });
  const authoredExact: IAutoMoviePose = fitChainToTarget({
    skeleton: exactSkeleton,
    pose: pole,
    chain: CHAIN,
    target: exactTarget,
    topology: exactTopology,
    referencePose: reference,
  });
  const resolved: IAutoMovieVector3 = resolvePose(
    continuous,
    exactSkeleton,
  ).find(
    (bone: ReturnType<typeof resolvePose>[number]): boolean =>
      bone.bone === CHAIN.effector,
  )!.worldPosition;
  TestValidator.equals(
    "equal-residual exact pin preserves the prior quaternion branch",
    namedFacts([
      [
        "distanceResolvedExactTarget",
        (): boolean => nclose(distance(resolved, exactTarget), 0, 1e-7),
      ],
      [
        "rotationDistanceContinuousReference",
        (): boolean =>
          nclose(rotationDistance(continuous, reference), 0, 1e-12),
      ],
      [
        "rotationDistanceContinuousReference2",
        (): boolean =>
          rotationDistance(continuous, reference) <
          rotationDistance(pole, reference),
      ],
      [
        "rotationDistanceAuthoredExactReference",
        (): boolean =>
          nclose(rotationDistance(authoredExact, reference), 0, 1e-12),
      ],
    ]),
    {
      distanceResolvedExactTarget: true,
      rotationDistanceContinuousReference: true,
      rotationDistanceContinuousReference2: true,
      rotationDistanceAuthoredExactReference: true,
    },
  );
}
