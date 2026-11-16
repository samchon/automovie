import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieSeededChainFit } from "./IAutoMovieSeededChainFit";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { PLANT_RESIDUAL_EPSILON } from "./constants/PLANT_RESIDUAL_EPSILON";
import { fitHingedChainCandidate } from "./fitHingedChainCandidate";
import type { prepareChainFit } from "./prepareChainFit";
import { resolvePreparedChainEffector } from "./resolvePreparedChainEffector";
import { resolvePreparedChainLower } from "./resolvePreparedChainLower";
import { solvePreparedChainPlant } from "./solvePreparedChainPlant";

/**
 * The bend-plane fit of `fitSeededChainToTarget`, before its effector is
 * oriented, with the seed of its hinged candidate when that candidate is the
 * answer: the hinged swivel candidate first when the mid joint is a hinge,
 * then the bend hint's plane, then the 32-plane sweep and its local
 * halvings, candidates ranked by their clamped residual's bucket
 * (`PLANT_RESIDUAL_EPSILON`), then their turn from the reference pose, then
 * the exact residual.
 *
 * @param target The current model-metre target.
 * @param workspace The unchanged source request and its scoped invariant data.
 * @returns The fitted pose and its hinged seed; failed preparation or analytic admission keeps the source pose with no seed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of the candidates, the ranking and the result.
 * @evidence contracts/development/implementation.md#principled-implementation The swivel parameterisation of Tolani, Goswami and Badler 2000 for a hinged mid joint (`fitHingedChainCandidate`), and a pole vector's bend plane as game-engine two-bone IK takes it, every candidate judged by its clamped forward kinematics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The search alone: preparation, the analytic solve, the swivel candidate and the candidate's forward kinematics have their own owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A degenerate preparation or solve keeps the given pose; no ideal measurement replaces the clamped forward kinematics.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most 34 initial candidates plus 32 minima times 20 refinement candidates, each a constant-size forward kinematics, and the search stops at the first exact one.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every target shares prepared frames/domains, lazy authored/reference reads and resolved chain clamps; each candidate's raw quaternions serve FK and continuity, while fixed prior conversions and authored continuity are lazy once. Target-specific scores, callback evaluations, ranking and cold/near mode are unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sweep's arrays hold at most 32 entries and every temporary pose is released with the call.
 */
export const fitChainBend: (
  target: IAutoMovieVector3,
  workspace: prepareChainFit.IWorkspace,
) => IAutoMovieSeededChainFit = (
  target: IAutoMovieVector3,
  workspace: prepareChainFit.IWorkspace,
): IAutoMovieSeededChainFit => {
  const props: IFitChainToTargetProps = { ...workspace.props, target };
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (prepared === null) return { pose: props.pose, seed: null };
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
  if (pole === null) return { pose: props.pose, seed: null };
  const { authored }: prepareChainFit.IReading = workspace.read();
  const distance: (position: IAutoMovieVector3) => number = (
    position: IAutoMovieVector3,
  ): number => Vector3.length(Vector3.subtract(position, props.target));
  let best: IPlantCandidate = {
    pose: props.pose,
    residual: distance(authored),
    continuity:
      props.referencePose === undefined ? 0 : workspace.authoredContinuity(),
  };
  const consider: (
    solved: NonNullable<ReturnType<typeof solve>>,
  ) => IPlantCandidateScore = (
    solved: NonNullable<ReturnType<typeof solve>>,
  ): IPlantCandidateScore => {
    const upper: IAutoMovieJointPose = workspace.clamp(solved.upper);
    const lower: IAutoMovieJointPose = workspace.clamp(solved.lower);
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
    const upperRotation: IAutoMovieQuaternion = jointToQuaternion(
      upper,
      props.jointAxes?.[upper.bone],
      props.restFrames?.[upper.bone],
    );
    const lowerRotation: IAutoMovieQuaternion = jointToQuaternion(
      lower,
      props.jointAxes?.[lower.bone],
      props.restFrames?.[lower.bone],
    );
    const candidateResidual: number = distance(
      resolvePreparedChainEffector(
        {
          prepared,
          upper,
          lower,
          jointAxes: props.jointAxes,
          restFrames: props.restFrames,
        },
        resolvePreparedChainLower.fromRotations(
          prepared,
          upperRotation,
          lowerRotation,
        ),
      ),
    );
    const continuity: number =
      workspace.continuity(upper.bone, upperRotation) +
      workspace.continuity(lower.bone, lowerRotation);
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
      const upper: IAutoMovieJointPose = workspace.clamp(hinged.upper);
      const lower: IAutoMovieJointPose = workspace.clamp(hinged.lower);
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
          pose: {
            ...props.pose,
            joints: [
              ...props.pose.joints.filter(
                (j: IAutoMovieJointPose): boolean =>
                  j.bone !== props.chain.upper && j.bone !== props.chain.lower,
              ),
              upper,
              lower,
            ],
          },
          seed: hinged.seed ?? null,
          ...(hinged.value === undefined ? {} : { value: hinged.value }),
        };
      consider(hinged);
    }
  }

  consider(pole);
  if (canFinish()) return { pose: best.pose, seed: null };

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
    const referenceLower: IAutoMovieResolvedBone = workspace.referenceLower();
    const referenceNormal: IAutoMovieVector3 = Vector3.cross(
      reachAxis,
      Vector3.subtract(referenceLower.worldPosition, upper.worldPosition),
    );
    if (Vector3.length(referenceNormal) >= 1e-6) {
      consider(solve(Vector3.normalize(referenceNormal))!);
      if (canFinish()) return { pose: best.pose, seed: null };
    }
  }

  const segments: number = 32;
  const sweep: IPlantBendCandidate[] = [];
  for (let index: number = 0; index < segments; ++index) {
    const angle: number = (2 * Math.PI * index) / segments;
    sweep.push({ angle, ...consider(solve(normalAt(angle))!) });
    if (canFinish()) return { pose: best.pose, seed: null };
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
        if (canFinish()) return { pose: best.pose, seed: null };
      }
    }
  }
  return { pose: best.pose, seed: null };
};

/** Existing squared-radian equality threshold for stopping an exact-pin search. */
const PLANT_CONTINUITY_EPSILON: number = 1e-12;

/** Residual and continuity keys under the solver's existing lexicographic order. */
interface IPlantCandidateScore {
  /** Actual target distance after rig-ROM clamping, model metres. */
  residual: number;

  /** Sum of squared upper/mid rotation distances to the reference, radians squared. */
  continuity: number;
}

/** Best actual pose and its unchanged contact/continuity scores. */
interface IPlantCandidate extends IPlantCandidateScore {
  /** Actual clamped pose, retaining the source root and unrelated authored joints. */
  pose: IAutoMoviePose;
}

/** Bend-plane parameter beside the contact/continuity scores it produced. */
interface IPlantBendCandidate extends IPlantCandidateScore {
  /** Bend-plane angle around the current reach axis, radians. */
  angle: number;
}

/** Place actual model-metre residual in the existing pin-accuracy bucket. */
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
