import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";
import { resolveBoneMap } from "./resolveBoneMap";
import { solvePreparedChainPlant } from "./solvePreparedChainPlant";

/**
 * Fit one two-bone chain onto a world-space target without leaving the rig's
 * effective ROM. The authored pose and a deterministic bend-plane search are
 * compared by the effector position they actually produce after clamping. A
 * candidate is accepted only when it improves the current residual bucket, or
 * when it preserves that bucket while moving closer to an explicit prior pose.
 *
 * This is the shared contact policy for ground planting and retargeting. A
 * world-down pole alone can lower a hinge joint into abduction/twist that its
 * ROM immediately removes. A fixed rest-hinge plane is insufficient too: a hip
 * ball joint rotates the knee's world hinge plane while reaching a lateral pin.
 * Searching around the reach axis finds that rotated plane, while keeping the
 * original pose in the candidate set makes an unreachable or constrained target
 * non-destructive.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Keeps every candidate inside the skeleton's declared joint ranges while seeking the target.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Chooses the closest legal articulated solve under the rig's ROM controls.
 * @author Samchon
 */
export const fitChainToTarget = (
  props: IFitChainToTargetProps,
): IAutoMoviePose => {
  const prepared = prepareChainPlant(props);
  if (prepared === null) return props.pose;
  const solve = (
    bendNormal?: IAutoMovieVector3,
  ): ReturnType<typeof solvePreparedChainPlant> =>
    solvePreparedChainPlant({
      prepared,
      target: props.target,
      bendNormal,
      jointAxes: props.jointAxes,
      restFrames: props.restFrames,
    });

  const pole = solve();
  if (pole === null) return props.pose;
  const authored = resolveBoneMap(
    props.skeleton,
    props.pose,
    props.topology,
    props.jointAxes,
    props.restFrames,
  ).get(props.chain.effector)!.worldPosition;
  const distance = (position: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(position, props.target));
  const reference = props.referencePose ?? props.pose;
  const referenceAngles = new Map(
    reference.joints.map((joint) => [joint.bone, joint] as const),
  );
  const authoredAngles = new Map(
    props.pose.joints.map((joint) => [joint.bone, joint] as const),
  );
  const rotationDistance = (
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
  const consider = (
    solved: NonNullable<ReturnType<typeof solve>>,
  ): IPlantCandidateScore => {
    const upper = clampJointToSkeleton(solved.upper, props.skeleton);
    const lower = clampJointToSkeleton(solved.lower, props.skeleton);
    const candidate: IAutoMoviePose = {
      ...props.pose,
      joints: [
        ...props.pose.joints.filter(
          (joint) =>
            joint.bone !== props.chain.upper &&
            joint.bone !== props.chain.lower,
        ),
        upper,
        lower,
      ],
    };
    const candidateResidual = distance(
      resolvedPreparedEffector({
        prepared,
        upper,
        lower,
        jointAxes: props.jointAxes,
        restFrames: props.restFrames,
      }),
    );
    const continuity =
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
    const score = { residual: candidateResidual, continuity };
    if (comparePlantCandidate(score, best) < 0)
      best = {
        pose: candidate,
        residual: candidateResidual,
        continuity,
      };
    return score;
  };
  const canFinish = (): boolean =>
    plantResidualBucket(best.residual) === 0 &&
    (props.referencePose === undefined ||
      best.continuity <= PLANT_CONTINUITY_EPSILON);

  consider(pole);
  if (canFinish()) return best.pose;

  const upper = prepared.upper;
  const reachAxis = Vector3.normalize(
    Vector3.subtract(props.target, upper.worldPosition),
  );
  let primary = Vector3.subtract(
    pole.hinge,
    Vector3.scale(reachAxis, Vector3.dot(pole.hinge, reachAxis)),
  );
  if (Vector3.length(primary) < 1e-6)
    primary = Vector3.cross(reachAxis, { x: 0, y: -1, z: 0 });
  if (Vector3.length(primary) < 1e-6)
    primary = Vector3.cross(reachAxis, { x: 0, y: 0, z: 1 });
  primary = Vector3.normalize(primary);
  const secondary = Vector3.normalize(Vector3.cross(reachAxis, primary));
  const normalAt = (angle: number): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.scale(primary, Math.cos(angle)),
      Vector3.scale(secondary, Math.sin(angle)),
    );

  if (props.referencePose !== undefined) {
    const referenceJoints = [props.chain.upper, props.chain.lower].map(
      (bone): IAutoMovieJointPose =>
        referenceAngles.get(bone) ?? {
          bone,
          flexion: null,
          abduction: null,
          twist: null,
        },
    );
    const referenceLower = resolveBoneMap(
      props.skeleton,
      {
        ...props.pose,
        joints: [
          ...props.pose.joints.filter(
            (joint) =>
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
    const referenceNormal = Vector3.cross(
      reachAxis,
      Vector3.subtract(referenceLower.worldPosition, upper.worldPosition),
    );
    if (Vector3.length(referenceNormal) >= 1e-6) {
      consider(solve(Vector3.normalize(referenceNormal))!);
      if (canFinish()) return best.pose;
    }
  }

  const segments = 32;
  const sweep: IPlantBendCandidate[] = [];
  for (let index = 0; index < segments; ++index) {
    const angle = (2 * Math.PI * index) / segments;
    sweep.push({ angle, ...consider(solve(normalAt(angle))!) });
    if (canFinish()) return best.pose;
  }
  const minima = sweep.filter((entry, index) => {
    const previous = sweep[(index + segments - 1) % segments]!;
    const next = sweep[(index + 1) % segments]!;
    const previousOrder = comparePlantCandidate(entry, previous);
    const nextOrder = comparePlantCandidate(entry, next);
    return (
      previousOrder <= 0 &&
      nextOrder <= 0 &&
      (previousOrder < 0 || nextOrder < 0)
    );
  });
  for (const minimum of minima) {
    let center = minimum;
    let step = (2 * Math.PI) / segments;
    for (let iteration = 0; iteration < 10; ++iteration) {
      step /= 2;
      for (const angle of [center.angle - step, center.angle + step]) {
        const candidate = {
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

const PLANT_RESIDUAL_EPSILON = 1e-7;

const PLANT_CONTINUITY_EPSILON = 1e-12;

interface IPlantCandidateScore {
  residual: number;
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

/** Selected clinical joints read through the same prepared chain and frames. */
interface IResolvedPreparedEffectorProps extends Pick<
  ISolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  upper: IAutoMovieJointPose;
  lower: IAutoMovieJointPose;
}

const plantResidualBucket = (residual: number): number =>
  Math.floor(residual / PLANT_RESIDUAL_EPSILON);

/** Residual buckets are ordered first; continuity breaks equivalent pins. */
const comparePlantCandidate = (
  left: IPlantCandidateScore,
  right: IPlantCandidateScore,
): number => {
  const residualOrder =
    plantResidualBucket(left.residual) - plantResidualBucket(right.residual);
  if (residualOrder !== 0) return residualOrder;
  const continuityOrder = left.continuity - right.continuity;
  return continuityOrder === 0
    ? left.residual - right.residual
    : continuityOrder;
};

/** Sign-insensitive geodesic distance between two joint rotations. */
const jointRotationDistance = (
  joint: IAutoMovieJointPose,
  reference: IAutoMovieJointPose | undefined,
  axes: IAutoMovieJointAxes | undefined,
  restFrame: IAutoMovieRestFrame | undefined,
): number => {
  const candidate = Quaternion.normalize(
    jointToQuaternion(joint, axes, restFrame),
  );
  const prior = Quaternion.normalize(
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
  const dot = Math.min(
    1,
    Math.abs(
      candidate.x * prior.x +
        candidate.y * prior.y +
        candidate.z * prior.z +
        candidate.w * prior.w,
    ),
  );
  const angle = 2 * Math.acos(dot);
  return angle * angle;
};

/** Resolve the pose-invariant chain data once for a bend-plane search. */
const prepareChainPlant = (
  props: Pick<
    IFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >,
): IPreparedChainPlant | null => {
  const { chain } = props;
  // The limb at rest under the current parent pose: zero its own articulation
  // so the recovered world rotations carry the torso pose but not the limb's.
  const zeroed: IAutoMoviePose = {
    skeleton: props.pose.skeleton,
    root: props.pose.root,
    joints: props.pose.joints.filter(
      (j) => j.bone !== chain.upper && j.bone !== chain.lower,
    ),
  };
  const map = resolveBoneMap(
    props.skeleton,
    zeroed,
    props.topology,
    props.jointAxes,
    props.restFrames,
  );
  const upper = map.get(chain.upper);
  const lower = map.get(chain.lower);
  const effector = map.get(chain.effector);
  if (upper === undefined || lower === undefined || effector === undefined)
    return null;
  if (
    isDescendant(props.topology, chain.upper, chain.lower) === false ||
    isDescendant(props.topology, chain.lower, chain.effector) === false
  )
    return null;

  const upperInverse = Quaternion.inverse(upper.worldRotation);
  const lowerInverse = Quaternion.inverse(lower.worldRotation);
  return {
    chain,
    upper,
    lower,
    upperDomain: {
      bone: chain.upper,
      constraint: getConstraint(
        chain.upper,
        props.skeleton.bones.find((bone) => bone.bone === chain.upper)
          ?.constraint ?? null,
      ),
    },
    lowerDomain: {
      bone: chain.lower,
      constraint: getConstraint(
        chain.lower,
        props.skeleton.bones.find((bone) => bone.bone === chain.lower)
          ?.constraint ?? null,
      ),
    },
    end: effector.worldPosition,
    hinge: Quaternion.rotateVector(
      lower.worldRotation,
      normalizeJointAxes(
        props.jointAxes?.[chain.lower] ?? DEFAULT_JOINT_AXES,
        "prepareChainPlant axes",
      ).flexion,
    ),
    lowerOffset: Quaternion.rotateVector(
      upperInverse,
      Vector3.subtract(lower.worldPosition, upper.worldPosition),
    ),
    lowerRotation: Quaternion.multiply(upperInverse, lower.worldRotation),
    effectorOffset: Quaternion.rotateVector(
      lowerInverse,
      Vector3.subtract(effector.worldPosition, lower.worldPosition),
    ),
  };
};

/** Whether a reachable bone sits strictly below another in the rig tree. */
const isDescendant = (
  topology: IAutoMovieSkeletonTopology,
  ancestor: AutoMovieHumanoidBone,
  descendant: AutoMovieHumanoidBone,
): boolean =>
  (topology.childrenByParent.get(ancestor) ?? []).some(
    (child) =>
      child.bone === descendant ||
      isDescendant(topology, child.bone, descendant),
  );

/** FK only the prepared chain after its two candidate joints are clamped. */
const resolvedPreparedEffector = (
  props: IResolvedPreparedEffectorProps,
): IAutoMovieVector3 => {
  const upperRotation = Quaternion.multiply(
    props.prepared.upper.worldRotation,
    jointToQuaternion(
      props.upper,
      props.jointAxes?.[props.prepared.chain.upper],
      props.restFrames?.[props.prepared.chain.upper],
    ),
  );
  const lowerPosition = Vector3.add(
    props.prepared.upper.worldPosition,
    Quaternion.rotateVector(upperRotation, props.prepared.lowerOffset),
  );
  const lowerRotation = Quaternion.multiply(
    Quaternion.multiply(upperRotation, props.prepared.lowerRotation),
    jointToQuaternion(
      props.lower,
      props.jointAxes?.[props.prepared.chain.lower],
      props.restFrames?.[props.prepared.chain.lower],
    ),
  );
  return Vector3.add(
    lowerPosition,
    Quaternion.rotateVector(lowerRotation, props.prepared.effectorOffset),
  );
};
