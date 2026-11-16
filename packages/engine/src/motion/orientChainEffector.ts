import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieChainBone } from "../kinematics/IAutoMovieChainBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./resolveChainEffectorBaseRotation";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";
import { splitDistalTwist } from "./splitDistalTwist";

/**
 * Turn a fitted effector toward a requested model-frame rotation within its
 * actual clinical domain. A distal mid bone takes its twist share first.
 * Removing the resulting lower rotation and the fixed lower-to-effector
 * frame leaves the articulation projected by prepareJointRotationProjection:
 * a finite analytic candidate list for a plain box with zero, one or two
 * mobile axes, and the existing bounded refinement for other domains.
 *
 * The fixed frame includes unchanged intermediate bones and the effector's
 * rest rotation. Prepared callers reuse that frame and chain-only FK.
 * Standalone callers retain full authored FK admission before deriving it;
 * unsupported chains retain the previous direct-rest fallback.
 *
 * @param props The fit request; without effectorRotation the pose returns unchanged.
 * @param fitted The fitted pose.
 * @param prepared Preparation for the same root, ancestors, intermediate pose and merged clinical mappings; only chain articulations may differ.
 * @returns The pose with the effector oriented inside its rig's limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States target/local frames, distal split, fixed intermediate transforms, analytic eligibility, fallback and the preparation/admission premises.
 * @evidence contracts/development/implementation.md#principled-implementation The requested articulation is inverse(fixedFrame) * inverse(lowerWorld) * requestedWorld. The shared quaternion projector minimizes angular error on a plain box with at most two mobile axes; unsupported coupled or three-axis domains retain bounded local refinement, with no global guarantee.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One twist split, one frame read and one shared projection replace a second local optimizer. Standalone FK and prepared FK meet at the same local target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Actual bone axes and ROM overrides govern projection. Residual error is not declared reached, and unsupported ancestry keeps the legacy own-rest fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms With a rotation request, frame reads, joint-array copies and actual bone/ROM lookups cost O(J+B) for J joints and B bones; supplied preparation uses chain FK, while standalone uses full FK once and again when a distal split is needed. The distal split makes at most five projector queries and final orientation one, at most six. Each eligible query scores its reference plus at most eighteen pairs, at most nineteen actual joint recompositions; unsupported queries keep the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions each. Missing rotation returns immediately; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares prepared fixed frames with candidate scoring and twist splitting, and shares the exact projection owner with their rotation scores. Preparation is valid only while root, non-chain pose and clinical mappings remain unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local frames and the projection closure are released with this call; the returned pose owns a new joint array and no cache or task is retained.
 */
export function orientChainEffector(
  props: IFitChainToTargetProps,
  fitted: IAutoMoviePose,
  prepared?: IPreparedChainPlant,
): IAutoMoviePose {
  if (props.effectorRotation === undefined) return fitted;
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    prepared !== undefined && props.jointAxes !== undefined
      ? props.jointAxes
      : skeletonJointAxes(props.skeleton, props.jointAxes);
  const pose: IAutoMoviePose = splitDistalTwist(
    props,
    axes,
    fitted,
    props.effectorRotation,
    prepared,
  );

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
      : resolvePreparedChainFrames({
          prepared,
          joints: pose.joints,
          jointAxes: axes,
          restFrames: props.restFrames,
        }).lower;
  const effectorBone: IAutoMovieBone | undefined = props.skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === props.chain.effector,
  );
  const rest: IAutoMovieQuaternion =
    prepared?.effectorBaseRotation ??
    (map?.has(props.chain.effector) === true
      ? resolveChainEffectorBaseRotation(
          { ...props, pose, jointAxes: axes },
          lower,
          map.get(props.chain.effector)!,
        )
      : (effectorBone?.rest.rotation ?? Quaternion.identity()));
  const local: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(rest),
      Quaternion.multiply(
        Quaternion.inverse(lower.worldRotation),
        props.effectorRotation,
      ),
    ),
  );
  const project: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose =
    prepareJointRotationProjection({
      domain: {
        bone: props.chain.effector,
        constraint: getConstraint(
          props.chain.effector,
          effectorBone?.constraint ?? null,
        ),
      },
      basis: normalizeJointAxes(
        axes[props.chain.effector] ?? DEFAULT_JOINT_AXES,
        "jointToQuaternion axes",
      ),
      frame: props.restFrames?.[props.chain.effector],
      clamp: clampJointToSkeleton.of(props.chain.effector, props.skeleton),
    });
  const effector: IAutoMovieJointPose = project(local);
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
