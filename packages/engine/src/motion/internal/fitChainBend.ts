import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSeededChainFit,
  IAutoMovieSolvePreparedChainPlantProps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import type { twoBoneChainArticulation } from "../../kinematics/internal/twoBoneChainArticulation";
import { Vector3 } from "../../math/Vector3";
import { PLANT_RESIDUAL_EPSILON } from "../constants/PLANT_RESIDUAL_EPSILON";
import { fitHingedChainBend } from "./fitHingedChainBend";
import type { prepareChainFit } from "./prepareChainFit";
import { resolvePreparedChainEffector } from "../resolvePreparedChainEffector";
import { resolvePreparedChainLower } from "./resolvePreparedChainLower";
import { solvePreparedChainPlant } from "../solvePreparedChainPlant";

/**
 * The bend-plane fit of `fitSeededChainToTarget`, before its effector is
 * oriented, with the seed of its hinged candidate when that candidate is the
 * answer: the hinged swivel candidate first when the mid joint is a hinge, then
 * the bend hint's plane, then the 32-plane sweep and its local halvings,
 * candidates ranked by their clamped residual's bucket
 * (`PLANT_RESIDUAL_EPSILON`), then their turn from the reference pose, then the
 * exact residual.
 *
 * @param props The current model-metre target with this workspace's unchanged
 *   source fields; its point stays unchanged through this synchronous search.
 * @param workspace The matching unchanged source request and its scoped
 *   invariant data.
 * @returns The fitted pose and its hinged seed; failed preparation or analytic
 *   admission keeps the source pose with no seed.
 */
export function fitChainBend(
  props: IAutoMovieFitChainToTargetProps,
  workspace: prepareChainFit.IWorkspace,
): IAutoMovieSeededChainFit {
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (prepared === null) return { pose: props.pose, seed: null };
  const solveProps: IAutoMovieSolvePreparedChainPlantProps = {
    prepared,
    target: props.target,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    bendNormal: undefined,
  };
  let targetPreparation:
    | twoBoneChainArticulation.IPreparedTarget
    | null
    | undefined;
  const solve: (
    bendNormal?: IAutoMovieVector3,
  ) => ReturnType<typeof solvePreparedChainPlant> = (
    bendNormal?: IAutoMovieVector3,
  ): ReturnType<typeof solvePreparedChainPlant> => {
    if (targetPreparation === undefined) {
      const source: ReturnType<typeof workspace.articulation> =
        workspace.articulation();
      targetPreparation = source === null ? null : source.target(props.target);
    }
    if (targetPreparation === null) return null;
    solveProps.bendNormal = bendNormal;
    return solvePreparedChainPlant(
      solveProps,
      workspace.rig,
      targetPreparation,
    );
  };

  // The analytic solve has an answer exactly where the source's triangle and
  // this target admit one (`twoBoneChainArticulation`: neither segment and
  // not the reach shorter than 1e-6), whatever the bend plane; a chain
  // without one keeps its pose. The pole candidate itself is solved below,
  // only when the hinged candidate is not the answer.
  const source: ReturnType<typeof workspace.articulation> =
    workspace.articulation();
  targetPreparation = source === null ? null : source.target(props.target);
  if (targetPreparation === null) return { pose: props.pose, seed: null };
  const { authored }: prepareChainFit.IReading = workspace.read();
  const authoredContinuity: number =
    props.referencePose === undefined ? 0 : workspace.authoredContinuity();
  let best: IPlantCandidate = {
    kind: "source",
    residual: Vector3.distance(authored, props.target),
    continuity: (): number => authoredContinuity,
  };
  let composeUpper:
    | ReturnType<typeof jointToQuaternionOnBasis.prepare>
    | undefined;
  let composeLower:
    | ReturnType<typeof jointToQuaternionOnBasis.prepare>
    | undefined;
  const consider: (
    solved: NonNullable<ReturnType<typeof solve>>,
  ) => IPlantCandidateScore = (
    solved: NonNullable<ReturnType<typeof solve>>,
  ): IPlantCandidateScore => {
    const upper: IAutoMovieJointPose = workspace.clamp(solved.upper);
    const lower: IAutoMovieJointPose = workspace.clamp(solved.lower);
    const upperBasis: IAutoMovieJointAxes = workspace.rig.jointBasis(
      upper.bone,
      "jointToQuaternion axes",
    );
    const upperFrame: IAutoMovieRestFrame | undefined =
      props.restFrames?.[upper.bone];
    composeUpper ??= jointToQuaternionOnBasis.prepare(upperBasis, upperFrame);
    const upperRotation: IAutoMovieQuaternion = composeUpper(upper);
    const lowerBasis: IAutoMovieJointAxes = workspace.rig.jointBasis(
      lower.bone,
      "jointToQuaternion axes",
    );
    const lowerFrame: IAutoMovieRestFrame | undefined =
      props.restFrames?.[lower.bone];
    composeLower ??= jointToQuaternionOnBasis.prepare(lowerBasis, lowerFrame);
    const lowerRotation: IAutoMovieQuaternion = composeLower(lower);
    const candidateResidual: number = Vector3.distance(
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
      props.target,
    );
    let turned: number | undefined;
    const continuity: () => number = (): number => {
      if (turned === undefined)
        turned =
          workspace.continuity(upper.bone, upperRotation) +
          workspace.continuity(lower.bone, lowerRotation);
      return turned;
    };
    const score: IPlantCandidateScore = {
      residual: candidateResidual,
      continuity,
    };
    if (comparePlantCandidate(score, best) < 0)
      best = {
        kind: "fitted",
        upper,
        lower,
        residual: candidateResidual,
        continuity,
      };
    return score;
  };

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
  // A hinged chain takes the swivel candidate whenever it reaches, so the
  // choice never alternates between two methods from frame to frame; the
  // hint plane and the sweep remain for a chain the swivel cannot solve.
  const hinged: ReturnType<typeof fitHingedChainBend> = fitHingedChainBend(
    props,
    workspace,
  );
  if (hinged !== null) {
    if (hinged.fitted !== null) return hinged.fitted;
    consider(hinged.candidate);
  }

  // A bend hint picks the bend plane as a pole vector does in two-bone IK, the
  // swivel about the root-to-target axis (Tolani, Goswami and Badler 2000,
  // Graphical Models 62(5):353): the mid joint is displaced toward the hint's
  // component across the root-to-target axis. Without a hint, the analytic
  // default bends toward world-down and the search below takes over.
  const pole: NonNullable<ReturnType<typeof solve>> = solve(
    props.bend === undefined
      ? undefined
      : hintNormal(prepared.upper.worldPosition, props.target, props.bend),
  )!;
  consider(pole);
  if (canFinish(props, best))
    return { pose: plantPose(props, workspace, best), seed: null };

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
  ): IAutoMovieVector3 => {
    const cosine: number = Math.cos(angle);
    const sine: number = Math.sin(angle);
    return {
      x: primary.x * cosine + secondary.x * sine,
      y: primary.y * cosine + secondary.y * sine,
      z: primary.z * cosine + secondary.z * sine,
    };
  };

  if (props.referencePose !== undefined) {
    const referenceLower: IAutoMovieResolvedBone = workspace.referenceLower();
    const referenceNormal: IAutoMovieVector3 = Vector3.cross(
      reachAxis,
      Vector3.subtract(referenceLower.worldPosition, upper.worldPosition),
    );
    if (Vector3.length(referenceNormal) >= 1e-6) {
      consider(solve(Vector3.normalize(referenceNormal))!);
      if (canFinish(props, best))
        return { pose: plantPose(props, workspace, best), seed: null };
    }
  }

  const segments: number = 32;
  const sweep: IPlantBendCandidate[] = [];
  for (let index: number = 0; index < segments; ++index) {
    const angle: number = (2 * Math.PI * index) / segments;
    sweep.push({ angle, ...consider(solve(normalAt(angle))!) });
    if (canFinish(props, best))
      return { pose: plantPose(props, workspace, best), seed: null };
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

      // Both probes belong to this iteration's old center, even when the
      // first probe replaces it before the second is evaluated.
      const left: number = center.angle - step;
      const right: number = center.angle + step;
      for (let probe: number = 0; probe < 2; ++probe) {
        const angle: number = probe === 0 ? left : right;
        const candidate: IPlantBendCandidate = {
          angle,
          ...consider(solve(normalAt(angle))!),
        };
        if (comparePlantCandidate(candidate, center) < 0) center = candidate;
        if (canFinish(props, best))
          return { pose: plantPose(props, workspace, best), seed: null };
      }
    }
  }
  return { pose: plantPose(props, workspace, best), seed: null };
}

/** Existing squared-radian equality threshold for stopping an exact-pin search. */
const PLANT_CONTINUITY_EPSILON: number = 1e-12;

/**
 * The original exact-pin stopping rule, evaluated from the current best after
 * each candidate.
 */
function canFinish(
  props: IAutoMovieFitChainToTargetProps,
  best: IPlantCandidateScore,
): boolean {
  return (
    plantResidualBucket(best.residual) === 0 &&
    (props.referencePose === undefined ||
      best.continuity() <= PLANT_CONTINUITY_EPSILON)
  );
}

/** Residual and continuity keys under the solver's existing lexicographic order. */
interface IPlantCandidateScore {
  /** Actual target distance after rig-ROM clamping, model metres. */
  residual: number;

  /**
   * Lazy actual squared-radian turn; only an equal residual bucket can rank by
   * it.
   */
  continuity(): number;
}

/**
 * Best actual source or clamped joint pair, without copying unused intermediate
 * pose arrays.
 */
type IPlantCandidate = IPlantCandidateScore &
  (
    | { kind: "source" }
    | { kind: "fitted"; upper: IAutoMovieJointPose; lower: IAutoMovieJointPose }
  );

/**
 * Only the final selected clamped pair needs the source's ordered
 * unrelated-joint prefix.
 */
function plantPose(
  props: IAutoMovieFitChainToTargetProps,
  workspace: prepareChainFit.IWorkspace,
  candidate: IPlantCandidate,
): IAutoMoviePose {
  return candidate.kind === "source"
    ? props.pose
    : workspace.pose(candidate.upper, candidate.lower);
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
  const continuityOrder: number = left.continuity() - right.continuity();
  return continuityOrder === 0
    ? left.residual - right.residual
    : continuityOrder;
};

/**
 * The bend-plane normal that displaces the mid joint toward a hint: the hint's
 * component across the root-to-target axis, crossed as the analytic default
 * crosses world-down (`axis x pole`). A hint on the axis gives no plane, so the
 * default is used.
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
