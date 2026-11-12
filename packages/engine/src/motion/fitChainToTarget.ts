import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { fitHingedChainCandidate } from "./fitHingedChainCandidate";
import { orientChainEffector } from "./orientChainEffector";
import { prepareChainPlant } from "./prepareChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolvePreparedChainEffector } from "./resolvePreparedChainEffector";
import { solvePreparedChainPlant } from "./solvePreparedChainPlant";

/**
 * Fit a reachable two-bone chain to a model-frame target under the rig's effective ROM, retaining authored non-chain joints. A deterministic finite bend-plane search scores clamped FK and keeps the original pose unless its 1e-7-metre residual bucket improves or equal-bucket continuity improves toward an explicit prior pose; it is a bounded search, not a global-optimum guarantee.
 *
 * For a hinged mid joint (an elbow or a knee, whose abduction is immobile) the swivel parameterisation of Tolani, Goswami and Badler (2000) comes first and wins whenever it reaches: the hinge angle follows from the span and the swivel about the root-to-target axis is swept for the least range-of-motion overshoot and then the least continuous cost of effector-rotation error, swing from the hint's side and turn from the `referencePose` (`fitHingedChainCandidate`), because a free-swing candidate turns the hinge about the plane normal and the clamp of its abduction moves the effector. Otherwise, and for other chains, the bend hint's plane and then the 32-plane sweep follow, the first exact one winning. When nothing reaches, the least clamped residual is returned, so an unreachable target leaves the effector on the reachable shell, not a pretended reach.
 *
 * With `effectorRotation`, a mid bone that declares a distal twist (a forearm) first takes the twist share of the requested rotation about its own length (swing-twist decomposition), clamped to its range, and the effector the remaining swing, so pronation and supination are the forearm's and the wrist keeps its place.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Prepares actual chain frames, solves analytic two-bone candidates, clamps upper/lower joints to rig ROM and measures their actual effector; residual buckets rank first, then squared sign-insensitive quaternion geodesic distance to the prior pose and finally exact residual.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Search policy stays here while preparation, analytic candidate solve and fast candidate FK have single owners; this split exposes the geometry shared by all bend candidates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing/invalid/degenerate preparation and analytic solve preserve the original pose; no ideal target measurement replaces post-clamp FK. A 32-angle sweep and ten local halvings bound the heuristic, with 1e-12 continuity and 1e-6 normal-degeneracy thresholds.
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre target, unchanged joints, residual-bucket ranking, prior-pose tie meaning and the bounded-search limitation without claiming every unreachable pin can be solved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and authored/reference FK scale with rig/joints; at most34 initial candidates plus at most32minima times20 refinement candidates use constant-size fast FK, though candidate pose copies scale with authored joints. Early exact-bucket/continuity satisfaction stops the search. A hinged chain adds up to two swivel sweeps of 720 decomposed candidates (360 one-degree swivels per bend branch), each with constant-size quaternion work and, with an effector rotation, two more decompositions; they run only when the hint plane misses or a rotation is requested.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All bend candidates share prepared frames/domains and reference-angle maps; only candidate joints and scores vary, while per-frame parent pose changes force new preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sweep/minima arrays are bounded by32 entries and all temporary poses/maps are released after completion; the caller owns the selected pose, which may be the original, and no handles or background tasks exist.
 */
export const fitChainToTarget: (
  props: IFitChainToTargetProps,
) => IAutoMoviePose = (input: IFitChainToTargetProps): IAutoMoviePose =>
  orientChainEffector(input, fitChainBend(input));

/**
 * The bend-plane fit of {@link fitChainToTarget}, before its effector is
 * oriented.
 *
 * @param input The fit request.
 * @returns The fitted pose.
 */
const fitChainBend: (input: IFitChainToTargetProps) => IAutoMoviePose = (
  input: IFitChainToTargetProps,
): IAutoMoviePose => {
  // Declared bone axes take precedence over the host table, once, so the
  // preparation, the analytic solve and the candidate FK read one basis.
  const props: IFitChainToTargetProps = {
    ...input,
    jointAxes: skeletonJointAxes(input.skeleton, input.jointAxes),
  };
  const prepared: ReturnType<typeof prepareChainPlant> =
    prepareChainPlant(props);
  if (prepared === null) return props.pose;
  const solve: (
    bendNormal?: IAutoMovieVector3,
  ) => ReturnType<typeof solvePreparedChainPlant> = (
    bendNormal?: IAutoMovieVector3,
  ): ReturnType<typeof solvePreparedChainPlant> =>
    solvePreparedChainPlant({
      prepared,
      target: props.target,
      bendNormal,
      jointAxes: props.jointAxes,
      restFrames: props.restFrames,
    });

  // A bend hint picks the bend plane the way a pole vector does in game-engine
  // two-bone IK (Unreal's Two Bone IK joint target, Unity's
  // TwoBoneIKConstraint hint): the mid joint is displaced toward the hint's
  // component across the root-to-target axis. Without a hint, the analytic
  // default bends toward world-down and the search below takes over.
  const pole: ReturnType<typeof solve> = solve(
    props.bend === undefined
      ? undefined
      : hintNormal(prepared.upper.worldPosition, props.target, props.bend),
  );
  if (pole === null) return props.pose;
  const authored: IAutoMovieVector3 = resolveBoneMap(
    props.skeleton,
    props.pose,
    props.topology,
    props.jointAxes,
    props.restFrames,
  ).get(props.chain.effector)!.worldPosition;
  const distance: (position: IAutoMovieVector3) => number = (
    position: IAutoMovieVector3,
  ): number => Vector3.length(Vector3.subtract(position, props.target));
  const reference: IAutoMoviePose = props.referencePose ?? props.pose;
  const referenceAngles: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> =
    new Map(
      reference.joints.map(
        (
          joint: IAutoMovieJointPose,
        ): readonly [AutoMovieHumanoidBone, IAutoMovieJointPose] =>
          [joint.bone, joint] as const,
      ),
    );
  const authoredAngles: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> =
    new Map(
      props.pose.joints.map(
        (
          joint: IAutoMovieJointPose,
        ): readonly [AutoMovieHumanoidBone, IAutoMovieJointPose] =>
          [joint.bone, joint] as const,
      ),
    );
  const rotationDistance: (
    bone: AutoMovieHumanoidBone,
    candidate: IAutoMovieJointPose | undefined,
  ) => number = (
    bone: AutoMovieHumanoidBone,
    candidate: IAutoMovieJointPose | undefined,
  ): number =>
    jointRotationDistance(
      candidate ?? {
        bone,
        flexion: null,
        abduction: null,
        twist: null,
      },
      referenceAngles.get(bone),
      props.jointAxes?.[bone],
      props.restFrames?.[bone],
    );
  let best: IPlantCandidate = {
    pose: props.pose,
    residual: distance(authored),
    continuity:
      props.referencePose === undefined
        ? 0
        : rotationDistance(
            props.chain.upper,
            authoredAngles.get(props.chain.upper),
          ) +
          rotationDistance(
            props.chain.lower,
            authoredAngles.get(props.chain.lower),
          ),
  };
  const consider: (
    solved: NonNullable<ReturnType<typeof solve>>,
  ) => IPlantCandidateScore = (
    solved: NonNullable<ReturnType<typeof solve>>,
  ): IPlantCandidateScore => {
    const upper: IAutoMovieJointPose = clampJointToSkeleton(
      solved.upper,
      props.skeleton,
    );
    const lower: IAutoMovieJointPose = clampJointToSkeleton(
      solved.lower,
      props.skeleton,
    );
    const candidate: IAutoMoviePose = {
      ...props.pose,
      joints: [
        ...props.pose.joints.filter(
          (joint: IAutoMovieJointPose): boolean =>
            joint.bone !== props.chain.upper &&
            joint.bone !== props.chain.lower,
        ),
        upper,
        lower,
      ],
    };
    const candidateResidual: number = distance(
      resolvePreparedChainEffector({
        prepared,
        upper,
        lower,
        jointAxes: props.jointAxes,
        restFrames: props.restFrames,
      }),
    );
    const continuity: number =
      jointRotationDistance(
        upper,
        referenceAngles.get(upper.bone),
        props.jointAxes?.[upper.bone],
        props.restFrames?.[upper.bone],
      ) +
      jointRotationDistance(
        lower,
        referenceAngles.get(lower.bone),
        props.jointAxes?.[lower.bone],
        props.restFrames?.[lower.bone],
      );
    const score: IPlantCandidateScore = {
      residual: candidateResidual,
      continuity,
    };
    if (comparePlantCandidate(score, best) < 0)
      best = {
        pose: candidate,
        residual: candidateResidual,
        continuity,
      };
    return score;
  };
  const canFinish: () => boolean = (): boolean =>
    plantResidualBucket(best.residual) === 0 &&
    (props.referencePose === undefined ||
      best.continuity <= PLANT_CONTINUITY_EPSILON);

  // A hinged mid joint (an elbow or a knee, whose abduction is immobile) can
  // bend only about its own flexion axis, while the free-swing candidates
  // turn it about the bend-plane normal and leave an abduction the ROM clamp
  // then removes, moving the effector. The swivel parameterisation (Tolani,
  // Goswami and Badler 2000) fixes the hinge angle from the span and spends
  // the remaining swivel about the root-to-effector axis on the rig's range
  // of motion; `hingedArmArticulation` sweeps it and keeps the candidate with
  // the least ROM overshoot, then the one nearest the bend hint. With a
  // requested effector rotation the swivel also decides whether that rotation
  // is reachable, since the end joint cannot twist about its own length (a
  // wrist turns only with the forearm's distal twist, an ankle only with the
  // whole leg's swivel, the hip's rotation): Tolani's analysis chooses the
  // swivel inside the end joint's limits too, so that candidate leads.
  const hingeAxes: IAutoMovieJointAxes | undefined =
    props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES;
  const hingedMid: boolean =
    prepared.lowerDomain.constraint !== null &&
    prepared.lowerDomain.constraint.abduction === null &&
    hingeAxes !== undefined;
  // A hinged chain takes the swivel candidate whenever it reaches, so the
  // choice never alternates between two methods from frame to frame; the
  // hint plane and the sweep remain for a chain the swivel cannot solve.
  if (hingedMid) {
    const hinged: NonNullable<ReturnType<typeof solve>> | null =
      fitHingedChainCandidate(
        props,
        prepared,
        hingeAxes!,
        props.effectorRotation,
      );
    if (hinged !== null) {
      const upper: IAutoMovieJointPose = clampJointToSkeleton(
        hinged.upper,
        props.skeleton,
      );
      const lower: IAutoMovieJointPose = clampJointToSkeleton(
        hinged.lower,
        props.skeleton,
      );
      const residual: number = distance(
        resolvePreparedChainEffector({
          prepared,
          upper,
          lower,
          jointAxes: props.jointAxes,
          restFrames: props.restFrames,
        }),
      );
      // A limb at its full length, or a knee or an elbow stopped at the end
      // of its range, rests the effector on the reachable shell along the
      // line to the target, the nearest point the chain allows, so that
      // candidate is the answer as well: handing
      // it to the search below would trade it between frames for whichever
      // free-swing candidate the clamp happened to leave a micrometre nearer.
      if (
        plantResidualBucket(Math.abs(residual - (hinged.shortfall ?? 0))) === 0
      )
        return {
          ...props.pose,
          joints: [
            ...props.pose.joints.filter(
              (j: IAutoMovieJointPose): boolean =>
                j.bone !== props.chain.upper && j.bone !== props.chain.lower,
            ),
            upper,
            lower,
          ],
        };
      consider(hinged);
    }
  }

  consider(pole);
  if (canFinish()) return best.pose;

  const upper: IAutoMovieResolvedBone = prepared.upper;
  const reachAxis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(props.target, upper.worldPosition),
  );
  let primary: IAutoMovieVector3 = Vector3.subtract(
    pole.hinge,
    Vector3.scale(reachAxis, Vector3.dot(pole.hinge, reachAxis)),
  );
  if (Vector3.length(primary) < 1e-6)
    primary = Vector3.cross(reachAxis, { x: 0, y: -1, z: 0 });
  if (Vector3.length(primary) < 1e-6)
    primary = Vector3.cross(reachAxis, { x: 0, y: 0, z: 1 });
  primary = Vector3.normalize(primary);
  const secondary: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(reachAxis, primary),
  );
  const normalAt: (angle: number) => IAutoMovieVector3 = (
    angle: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.scale(primary, Math.cos(angle)),
      Vector3.scale(secondary, Math.sin(angle)),
    );

  if (props.referencePose !== undefined) {
    const referenceJoints: IAutoMovieJointPose[] = [
      props.chain.upper,
      props.chain.lower,
    ].map(
      (bone: AutoMovieHumanoidBone): IAutoMovieJointPose =>
        referenceAngles.get(bone) ?? {
          bone,
          flexion: null,
          abduction: null,
          twist: null,
        },
    );
    const referenceLower: IAutoMovieResolvedBone = resolveBoneMap(
      props.skeleton,
      {
        ...props.pose,
        joints: [
          ...props.pose.joints.filter(
            (joint: IAutoMovieJointPose): boolean =>
              joint.bone !== props.chain.upper &&
              joint.bone !== props.chain.lower,
          ),
          ...referenceJoints,
        ],
      },
      props.topology,
      props.jointAxes,
      props.restFrames,
    ).get(props.chain.lower)!;
    const referenceNormal: IAutoMovieVector3 = Vector3.cross(
      reachAxis,
      Vector3.subtract(referenceLower.worldPosition, upper.worldPosition),
    );
    if (Vector3.length(referenceNormal) >= 1e-6) {
      consider(solve(Vector3.normalize(referenceNormal))!);
      if (canFinish()) return best.pose;
    }
  }

  const segments: number = 32;
  const sweep: IPlantBendCandidate[] = [];
  for (let index: number = 0; index < segments; ++index) {
    const angle: number = (2 * Math.PI * index) / segments;
    sweep.push({ angle, ...consider(solve(normalAt(angle))!) });
    if (canFinish()) return best.pose;
  }
  const minima: IPlantBendCandidate[] = sweep.filter(
    (entry: IPlantBendCandidate, index: number): boolean => {
      const previous: IPlantBendCandidate =
        sweep[(index + segments - 1) % segments]!;
      const next: IPlantBendCandidate = sweep[(index + 1) % segments]!;
      const previousOrder: number = comparePlantCandidate(entry, previous);
      const nextOrder: number = comparePlantCandidate(entry, next);
      return (
        previousOrder <= 0 &&
        nextOrder <= 0 &&
        (previousOrder < 0 || nextOrder < 0)
      );
    },
  );
  for (const minimum of minima) {
    let center: IPlantBendCandidate = minimum;
    let step: number = (2 * Math.PI) / segments;
    for (let iteration: number = 0; iteration < 10; ++iteration) {
      step /= 2;
      for (const angle of [center.angle - step, center.angle + step]) {
        const candidate: IPlantBendCandidate = {
          angle,
          ...consider(solve(normalAt(angle))!),
        };
        if (comparePlantCandidate(candidate, center) < 0) center = candidate;
        if (canFinish()) return best.pose;
      }
    }
  }
  return best.pose;
};

const PLANT_RESIDUAL_EPSILON: number = 1e-7;

const PLANT_CONTINUITY_EPSILON: number = 1e-12;

interface IPlantCandidateScore {
  /** Actual target distance after rig-ROM clamping, model metres. */
  residual: number;

  /** Squared joint-rotation distance to the reference pose. */
  continuity: number;
}

/** Best actual pose and its unchanged contact/continuity scores. */
interface IPlantCandidate extends IPlantCandidateScore {
  pose: IAutoMoviePose;
}

/** Bend-plane parameter beside the contact/continuity scores it produced. */
interface IPlantBendCandidate extends IPlantCandidateScore {
  angle: number;
}

const plantResidualBucket: (residual: number) => number = (
  residual: number,
): number => Math.floor(residual / PLANT_RESIDUAL_EPSILON);

/** Residual buckets are ordered first; continuity breaks equivalent pins. */
const comparePlantCandidate: (
  left: IPlantCandidateScore,
  right: IPlantCandidateScore,
) => number = (
  left: IPlantCandidateScore,
  right: IPlantCandidateScore,
): number => {
  const residualOrder: number =
    plantResidualBucket(left.residual) - plantResidualBucket(right.residual);
  if (residualOrder !== 0) return residualOrder;
  const continuityOrder: number = left.continuity - right.continuity;
  return continuityOrder === 0
    ? left.residual - right.residual
    : continuityOrder;
};

/** Sign-insensitive geodesic distance between two joint rotations. */
const jointRotationDistance: (
  joint: IAutoMovieJointPose,
  reference: IAutoMovieJointPose | undefined,
  axes: IAutoMovieJointAxes | undefined,
  restFrame: IAutoMovieRestFrame | undefined,
) => number = (
  joint: IAutoMovieJointPose,
  reference: IAutoMovieJointPose | undefined,
  axes: IAutoMovieJointAxes | undefined,
  restFrame: IAutoMovieRestFrame | undefined,
): number => {
  const candidate: IAutoMovieQuaternion = Quaternion.normalize(
    jointToQuaternion(joint, axes, restFrame),
  );
  const prior: IAutoMovieQuaternion = Quaternion.normalize(
    jointToQuaternion(
      reference ?? {
        bone: joint.bone,
        flexion: null,
        abduction: null,
        twist: null,
      },
      axes,
      restFrame,
    ),
  );
  const angle: number = Quaternion.angle(candidate, prior);
  return angle * angle;
};

/**
 * The bend-plane normal that displaces the mid joint toward a hint: the
 * hint's component across the root-to-target axis, crossed as the analytic
 * default crosses world-down (`axis x pole`). A hint on the axis gives no
 * plane, so the default is used.
 *
 * @param root The chain root, model metres.
 * @param target The effector target, model metres.
 * @param bend The hint, model metres.
 * @returns The unit normal, or undefined when the hint lies on the axis.
 */
function hintNormal(
  root: IAutoMovieVector3,
  target: IAutoMovieVector3,
  bend: IAutoMovieVector3,
): IAutoMovieVector3 | undefined {
  const axis: IAutoMovieVector3 = Vector3.subtract(target, root);
  if (Vector3.length(axis) < 1e-9) return undefined;
  const unitAxis: IAutoMovieVector3 = Vector3.normalize(axis);
  const toward: IAutoMovieVector3 = Vector3.subtract(bend, root);
  const across: IAutoMovieVector3 = Vector3.subtract(
    toward,
    Vector3.scale(unitAxis, Vector3.dot(toward, unitAxis)),
  );
  if (Vector3.length(across) < 1e-9) return undefined;
  return Vector3.normalize(Vector3.cross(unitAxis, Vector3.normalize(across)));
}
