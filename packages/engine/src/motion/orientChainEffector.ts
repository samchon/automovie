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
  IAutoMovieVector3,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { prepareChainFit } from "./prepareChainFit";
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
 * @param rig Optional lazy rig of the same source workspace; basis, clamps, local projection and fixed inverse remain valid only under unchanged rig/frame dependencies.
 * @param capture Immediate reader of the final projected rotation and optional position, when the native rig admitted the lower prefix.
 * @returns The pose with the effector oriented inside its rig's limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States target/local frames, distal split, fixed intermediate transforms, analytic eligibility, fallback and the preparation/admission premises.
 * @evidence contracts/development/implementation.md#principled-implementation The requested articulation is inverse(fixedFrame) * inverse(lowerWorld) * requestedWorld. The shared quaternion projector minimizes angular error on a plain box with at most two mobile axes; unsupported coupled or three-axis domains retain bounded local refinement, with no global guarantee.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One twist split, one frame read and one shared projection replace a second local optimizer. Standalone FK and prepared FK meet at the same local target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Actual bone axes and ROM overrides govern projection. Residual error is not declared reached, and unsupported ancestry keeps the legacy own-rest fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms Frame/joint-array work remains O(J), with shared source rig setup or O(B) standalone work. A distal split makes at most five actual projector queries; when its winning local demand exactly matches the final recomputed one, orientation reuses that selected joint, otherwise one final query runs. Eligible queries score at most nineteen unique articulations; generic refinement retains its existing bound. Missing rotation returns immediately and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Matching source frames, basis, clamp, projector and fixed inverse retain their original first-use sites. After actual final lower FK, rest removal and basis/projector setup still run, the split's copied selected effector joint may serve only a four-component Object.is-identical local demand under the same unchanged dependencies. Different demands and non-distal inputs run ordinary projection; no target answer crosses this operation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local frames end with this call and the returned pose owns a new joint array. A supplied rig/projector is borrowed until its caller releases the workspace; standalone projection ends with this call. No query history, external handle or task is retained.
 */
export function orientChainEffector(
  props: IAutoMovieFitChainToTargetProps,
  fitted: IAutoMoviePose,
  prepared?: IAutoMoviePreparedChainPlant,
  rig?: prepareChainFit.IRig,
  capture?: orientChainEffector.IReading,
): IAutoMoviePose {
  if (props.effectorRotation === undefined) return fitted;
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    prepared !== undefined && props.jointAxes !== undefined
      ? props.jointAxes
      : skeletonJointAxes(props.skeleton, props.jointAxes);
  const split: splitDistalTwist.IResult = splitDistalTwist.withProjection(
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
    prepareJointRotationProjection({
      domain: {
        bone: props.chain.effector,
        constraint: getConstraint(
          props.chain.effector,
          effectorBone?.constraint ?? null,
        ),
      },
      basis,
      frame: props.restFrames?.[props.chain.effector],
      clamp: clampJointToSkeleton.of(props.chain.effector, props.skeleton),
    });
  const previous: splitDistalTwist.IResult["projection"] = split.projection;
  const effector: IAutoMovieJointPose = previous !== undefined &&
    Object.is(previous.local.x, local.x) && Object.is(previous.local.y, local.y) &&
    Object.is(previous.local.z, local.z) && Object.is(previous.local.w, local.w)
      ? previous.joint : project(local);
  if (capture !== undefined && prepared !== undefined && rig !== undefined) {
    const articulation: IAutoMovieQuaternion = rig.composer(effector.bone, props.restFrames?.[effector.bone])(effector);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(lower.worldRotation, prepared.effectorBaseRotation),
      articulation,
    );
    capture(rotation, () => Vector3.add(
      lower.worldPosition,
      Quaternion.rotateVector(lower.worldRotation, prepared.effectorOffset),
    ));
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

/**
 * The synchronous observation of this operation's produced orientation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The captured orientation is model-relative. Reading the endpoint later in the same call computes its position from the same admitted lower frame.
 * @evidence contracts/development/design.md#principled-representation The accepted effector articulation and lower prefix define one world rotation and one wrist or ankle centre.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the contact fitter demands this optional observation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ordinary pose remains the source of truth without a native prepared rig.
 */
export namespace orientChainEffector {
  /** An immediate contact reader of the admitted lower prefix and final projected orientation. */
  export type IReading = (
    rotation: IAutoMovieQuaternion,
    position: () => IAutoMovieVector3,
  ) => void;
}
