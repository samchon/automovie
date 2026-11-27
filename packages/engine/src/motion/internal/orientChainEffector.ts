import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieChainBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../../kinematics/internal/normalizeJointAxes";
import { skeletonJointAxes } from "../../kinematics/internal/skeletonJointAxes";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { getConstraint } from "../../rom/internal/getConstraint";
import { AutoMovieEngineMotionJointProjection } from "../AutoMovieEngineMotionJointProjection";
import { AutoMovieEngineMotionChainTwist } from "../AutoMovieEngineMotionChainTwist";
import type { IAutoMovieEngineMotionChainEffectorReading } from "./IAutoMovieEngineMotionChainEffectorReading";
import type { prepareChainFit } from "./prepareChainFit";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./resolveChainEffectorBaseRotation";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";

/**
 * Turn a fitted effector toward a requested model-frame rotation within its
 * actual clinical domain. A distal mid bone takes its twist share first.
 * Removing the resulting lower rotation and the fixed lower-to-effector frame
 * leaves the articulation projected by prepareJointRotationProjection: a finite
 * analytic candidate list for a plain box with zero, one or two mobile axes,
 * and the existing bounded refinement for other domains.
 *
 * The fixed frame includes unchanged intermediate bones and the effector's rest
 * rotation. Prepared callers reuse that frame and chain-only FK. Standalone
 * callers retain full authored FK admission before deriving it; unsupported
 * chains retain the previous direct-rest fallback.
 *
 * @param props The fit request; without effectorRotation the pose returns
 *   unchanged.
 * @param fitted The fitted pose.
 * @param prepared Preparation for the same root, ancestors, intermediate pose
 *   and merged clinical mappings; only chain articulations may differ.
 * @param rig Optional lazy rig of the same source workspace; basis, clamps,
 *   local projection and fixed inverse remain valid only under unchanged
 *   rig/frame dependencies.
 * @param capture Immediate reader of the final projected rotation and optional
 *   position, when the native rig admitted the lower prefix.
 * @returns The pose with the effector oriented inside its rig's limits.
 */
export function orientChainEffector(
  props: IAutoMovieFitChainToTargetProps,
  fitted: IAutoMoviePose,
  prepared?: IAutoMoviePreparedChainPlant,
  rig?: prepareChainFit.IRig,
  capture?: IAutoMovieEngineMotionChainEffectorReading,
): IAutoMoviePose {
  if (props.effectorRotation === undefined) return fitted;
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    prepared !== undefined && props.jointAxes !== undefined
      ? props.jointAxes
      : skeletonJointAxes(props.skeleton, props.jointAxes);
  const split: AutoMovieEngineMotionChainTwist.IResult = AutoMovieEngineMotionChainTwist.withProjection(
    props,
    axes,
    fitted,
    props.effectorRotation,
    prepared,
    rig,
  );
  const pose: IAutoMoviePose = split.pose;

  // Full FK remains the standalone admission owner, in authored record order.
  const map: ReturnType<typeof resolveBoneMap> | undefined =
    prepared === undefined
      ? resolveBoneMap(
          props.skeleton,
          pose,
          props.topology,
          axes,
          props.restFrames,
        )
      : undefined;
  const lower: IAutoMovieChainBone =
    prepared === undefined
      ? map!.get(props.chain.lower)!
      : resolvePreparedChainFrames.lower({
          prepared,
          joints: pose.joints,
          jointAxes: axes,
          restFrames: props.restFrames,
          ...(rig === undefined ? {} : { rig }),
        });
  const effectorBone: IAutoMovieBone | undefined =
    rig === undefined
      ? props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === props.chain.effector,
        )
      : rig.bone(props.chain.effector);
  const rest: IAutoMovieQuaternion =
    prepared?.effectorBaseRotation ??
    (map?.has(props.chain.effector) === true
      ? resolveChainEffectorBaseRotation(
          { ...props, pose, jointAxes: axes },
          lower,
          map.get(props.chain.effector)!,
        )
      : (effectorBone?.rest.rotation ?? Quaternion.identity()));
  const restInverse: IAutoMovieQuaternion =
    (prepared === undefined ? undefined : rig?.effectorRestInverse()) ??
    Quaternion.inverse(rest);
  const local: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      restInverse,
      Quaternion.multiply(
        Quaternion.inverse(lower.worldRotation),
        props.effectorRotation,
      ),
    ),
  );
  const basis: IAutoMovieJointAxes =
    rig?.basis(props.chain.effector, "jointToQuaternion axes") ??
    normalizeJointAxes(
      axes[props.chain.effector] ?? DEFAULT_JOINT_AXES,
      "jointToQuaternion axes",
    );
  const project: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose =
    rig?.effectorProjection() ??
    AutoMovieEngineMotionJointProjection.prepare({
      domain: {
        bone: props.chain.effector,
        constraint: getConstraint(
          props.chain.effector,
          effectorBone?.constraint ?? null,
        ),
      },
      basis,
      frame: props.restFrames?.[props.chain.effector],
      clamp: AutoMovieEngineKinematics.clampJointToSkeletonOf(
        props.chain.effector,
        props.skeleton,
      ),
    });
  const previous: AutoMovieEngineMotionChainTwist.IResult["projection"] = split.projection;
  const effector: IAutoMovieJointPose =
    previous !== undefined &&
    Object.is(previous.local.x, local.x) &&
    Object.is(previous.local.y, local.y) &&
    Object.is(previous.local.z, local.z) &&
    Object.is(previous.local.w, local.w)
      ? previous.joint
      : project(local);
  if (capture !== undefined && prepared !== undefined && rig !== undefined) {
    const articulation: IAutoMovieQuaternion = rig.composer(
      effector.bone,
      props.restFrames?.[effector.bone],
    )(effector);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(lower.worldRotation, prepared.effectorBaseRotation),
      articulation,
    );
    capture(rotation, () =>
      Vector3.add(
        lower.worldPosition,
        Quaternion.rotateVector(lower.worldRotation, prepared.effectorOffset),
      ),
    );
  }
  return {
    ...pose,
    joints: [
      ...pose.joints.filter(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone !== props.chain.effector,
      ),
      effector,
    ],
  };
}
