import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieEngineDefaultJointAxes } from "../../kinematics/AutoMovieEngineDefaultJointAxes";
import { normalizeJointAxes } from "../../kinematics/internal/normalizeJointAxes";
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import type { AutoMovieEngineSkeletonPose } from "../../kinematics/AutoMovieEngineSkeletonPose";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { getConstraint } from "../../rom/internal/getConstraint";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./resolveChainEffectorBaseRotation";

/*
 * Prepare articulation-free frames and effective domains for one reachable
 * descendant two-bone chain in the current pose's resolved model-metre frame.
 * Missing bones or invalid ancestry return null; supplied topology and clinical
 * mappings must match the unchanged skeleton. An optional resolution reader
 * shares only exact completed FK work within the same synchronous fit. An
 * explicit poseResolution must snapshot that exact rig/topology/mappings; its
 * demand is the upper, lower and effector, while omission keeps raw full FK.
 */
export function prepareChainPlant(
  props: Pick<
    IAutoMovieFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >,
  resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  poseResolution?: AutoMovieEngineSkeletonPose.IRig,
): IAutoMoviePreparedChainPlant | null {
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
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseResolution === undefined
      ? resolveBoneMap(
          props.skeleton,
          zeroed,
          props.topology,
          props.jointAxes,
          props.restFrames,
          resolution,
        )
      : poseResolution.resolveMap(
          zeroed,
          resolution,
          new Set([chain.upper, chain.lower, chain.effector]),
        );
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

  const upperInverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    upper.worldRotation,
  );
  const lowerInverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
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
    hinge: AutoMovieEngineQuaternion.rotateVector(
      lower.worldRotation,
      normalizeJointAxes(
        props.jointAxes?.[chain.lower] ?? AutoMovieEngineDefaultJointAxes,
        "prepareChainPlant axes",
      ).flexion,
    ),
    lowerOffset: AutoMovieEngineQuaternion.rotateVector(
      upperInverse,
      AutoMovieEngineVector3.subtract(lower.worldPosition, upper.worldPosition),
    ),
    lowerRotation: AutoMovieEngineQuaternion.multiply(upperInverse, lower.worldRotation),
    effectorOffset: AutoMovieEngineQuaternion.rotateVector(
      lowerInverse,
      AutoMovieEngineVector3.subtract(effector.worldPosition, lower.worldPosition),
    ),
    effectorBaseRotation,
  };
}
