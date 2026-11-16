import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import type { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { getConstraint } from "../rom/getConstraint";
import { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { IPreparedChainPlant } from "./IPreparedChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./resolveChainEffectorBaseRotation";

/**
 * Prepare articulation-free frames and effective domains for one reachable descendant two-bone chain in the current pose's resolved model-metre frame. Missing bones or invalid ancestry return null; supplied topology and clinical mappings must match the unchanged skeleton. An optional resolution reader shares only exact completed FK work within the same synchronous fit. An explicit poseResolution must snapshot that exact rig/topology/mappings; its demand is the upper, lower and effector, while omission keeps raw full FK.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Removes only upper/lower articulation before FK, preserving current parent pose; strict descendant checks allow fixed intermediate bones, and relative rotations/local offsets recover the same chain for candidate FK under actual effective ROM.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns pose-invariant geometry used by the inverse solve, candidate point reader and final chain-frame reader, while target/bend choice belongs to each candidate input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unresolved or branched pseudo-chains return null rather than treating same-named bones as adjacent; domains come from getConstraint on the actual rig, and no alternate geometric proxy replaces its offsets.
 * @evidence contracts/development/common.md#meaningful-documentation States articulation removal, model frame, topology/mapping premises, descendant-chain admission and null meaning.
 * @evidence contracts/development/implementation.md#efficient-algorithms One raw full FK or explicit prepared three-bone ancestor demand, plus two skeleton-domain scans and bounded descendant walks. Every zeroed authored record remains admitted in order; returned geometry has constant-size vectors/frames/domains. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One record serves every candidate of the fixed source/chain. A supplied operation reader shares exact completed math; genuine immutable poseResolution shares static prerequisites and actual dependency rows with related poses. Fixed-frame recovery reuses that same producer's successful end conversion while rechecking the current joint. It must describe the exact rig/topology/mappings; changed source geometry requires new preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned fields borrow chain and resolved records and own derived offsets/relative rotations; temporary zeroed joints/FK map are released after return/null, with no resource handles.
 */
export const prepareChainPlant: (
  props: Pick<
    IFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >,
  resolution?: ReturnType<typeof preparePoseResolution>,
  poseResolution?: prepareSkeletonPoseResolution.IRig,
) => IPreparedChainPlant | null = (
  props: Pick<
    IFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >,
  resolution?: ReturnType<typeof preparePoseResolution>,
  poseResolution?: prepareSkeletonPoseResolution.IRig,
): IPreparedChainPlant | null => {
  const { chain }: typeof props = props;
  // The limb at rest under the current parent pose: zero its own articulation
  // so the recovered world rotations carry the torso pose but not the limb's.
  const zeroed: IAutoMoviePose = {
    skeleton: props.pose.skeleton,
    root: props.pose.root,
    joints: props.pose.joints.filter(
      (j: IAutoMovieJointPose): boolean =>
        j.bone !== chain.upper && j.bone !== chain.lower,
    ),
  };
  const map: ReturnType<typeof resolveBoneMap> = poseResolution === undefined
    ? resolveBoneMap(props.skeleton, zeroed, props.topology, props.jointAxes,
        props.restFrames, resolution)
    : new Map(poseResolution.resolve(zeroed, resolution,
        new Set([chain.upper, chain.lower, chain.effector])).map(
        (bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] =>
          [bone.bone, bone],
      ));
  const upper: IAutoMovieResolvedBone | undefined = map.get(chain.upper);
  const lower: IAutoMovieResolvedBone | undefined = map.get(chain.lower);
  const effector: IAutoMovieResolvedBone | undefined = map.get(chain.effector);
  if (upper === undefined || lower === undefined || effector === undefined)
    return null;
  if (
    resolveChainEffectorBaseRotation.isDescendant(
      props.topology,
      chain.upper,
      chain.lower,
    ) === false ||
    resolveChainEffectorBaseRotation.isDescendant(
      props.topology,
      chain.lower,
      chain.effector,
    ) === false
  )
    return null;

  const upperInverse: IAutoMovieQuaternion = Quaternion.inverse(
    upper.worldRotation,
  );
  const lowerInverse: IAutoMovieQuaternion = Quaternion.inverse(
    lower.worldRotation,
  );

  // The same fixed-frame recovery serves readers that already resolved the
  // authored pose, so standalone FK admission need not be reordered.
  const effectorBaseRotation: IAutoMovieQuaternion =
    resolveChainEffectorBaseRotation.fromPrepared(
      props,
      lower,
      effector,
      lowerInverse,
      resolution,
      poseResolution,
    );
  return {
    chain,
    upper,
    lower,
    upperDomain: {
      bone: chain.upper,
      constraint: getConstraint(
        chain.upper,
        props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === chain.upper,
        )?.constraint ?? null,
      ),
    },
    lowerDomain: {
      bone: chain.lower,
      constraint: getConstraint(
        chain.lower,
        props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === chain.lower,
        )?.constraint ?? null,
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
    effectorBaseRotation,
  };
};
