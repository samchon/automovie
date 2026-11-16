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
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./resolveChainEffectorBaseRotation";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Give a distally twisting mid bone its bounded twist share before orienting
 * the effector. The existing solveDistalTwist candidate law starts from the
 * current articulation, clamps the mid joint and ranks the effector rotation
 * its shared projector will actually show. It is not a global solve over both
 * joints. Bones without distal twist return unchanged.
 *
 * The fixed effector frame includes intermediate rests and articulations.
 * Twisting leaves the effector point unchanged when the lower-to-effector
 * offset is parallel to the lower twist axis, as on the canonical limb rig;
 * an arbitrary offset does not satisfy that point-preservation premise.
 *
 * @param props The fit request.
 * @param axes Merged actual clinical axes.
 * @param pose The fitted pose.
 * @param rotation Requested model-frame effector rotation.
 * @param prepared Matching preparation with unchanged root, non-chain pose and clinical mappings.
 * @returns The pose with the mid bone's twist set within the actual rig's limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current-pose reference, bounded candidate law, actual displayed effector ranking, fixed intermediate frame and the exact point-preservation premise.
 * @evidence contracts/development/implementation.md#principled-implementation The lower world rotation factors into its preceding frame and articulation; removing the latter gives the frame solveDistalTwist needs. A distal twist preserves the effector point only for an offset parallel to its axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared or standalone frame read and one shared solve; standalone full FK admits authored records before fixed-frame recovery.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Actual ROM bounds the twist and the shared projector reports any remaining effector miss. Neither the five-candidate law nor arbitrary intermediate offsets are claimed to guarantee a full pose target.
 * @evidence contracts/development/implementation.md#efficient-algorithms A distal call has O(J+B) work for authored-frame and last-record scans, joint-array copying and actual bone/ROM lookups; preparation uses chain FK, while standalone adds full FK and bounded ancestry checks. At most five distinct twists query the projector. Each eligible query scores its reference plus at most eighteen pairs, at most nineteen actual joint recompositions; unsupported queries keep the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions each. A non-distal lower returns immediately; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares prepared fixed frames with orientation and the twist solver with candidate scoring; last authored lower/effector records match full FK semantics.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All derived frames and solve closures end with this call; the returned pose owns its new joint array and no cache, handle or task persists.
 */
export function splitDistalTwist(
  props: IFitChainToTargetProps,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  pose: IAutoMoviePose,
  rotation: IAutoMovieQuaternion,
  prepared?: IPreparedChainPlant,
): IAutoMoviePose {
  const lowerAxes: IAutoMovieJointAxes | undefined = axes[props.chain.lower];
  if (lowerAxes?.twistPlacement !== "distal") return pose;
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
  const world: IAutoMovieChainBone =
    prepared === undefined
      ? map!.get(props.chain.lower)!
      : resolvePreparedChainFrames({
          prepared,
          joints: pose.joints,
          jointAxes: axes,
          restFrames: props.restFrames,
        }).lower;
  let current: IAutoMovieJointPose = {
    bone: props.chain.lower,
    flexion: null,
    abduction: null,
    twist: null,
  };
  let held: IAutoMovieJointPose = {
    bone: props.chain.effector,
    flexion: null,
    abduction: null,
    twist: null,
  };
  for (const joint of pose.joints) {
    if (joint.bone === props.chain.lower) current = joint;
    if (joint.bone === props.chain.effector) held = joint;
  }
  const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes(
    lowerAxes,
    "splitDistalTwist axes",
  );
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    world.worldRotation,
    Quaternion.inverse(
      jointToQuaternionOnBasis(current, lowerBasis, lowerFrame),
    ),
  );
  const effectorBone: IAutoMovieBone | undefined = props.skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === props.chain.effector,
  );
  const rest: IAutoMovieQuaternion =
    prepared?.effectorBaseRotation ??
    (map?.has(props.chain.effector) === true
      ? resolveChainEffectorBaseRotation(
          { ...props, pose, jointAxes: axes },
          world,
          map.get(props.chain.effector)!,
        )
      : (effectorBone?.rest.rotation ?? Quaternion.identity()));
  const lower: IAutoMovieJointPose = solveDistalTwist({
    joint: current,
    effector: held,
    above,
    lowerBasis,
    lowerFrame,
    effectorRest: rest,
    effectorBasis: normalizeJointAxes(
      axes[props.chain.effector] ?? DEFAULT_JOINT_AXES,
      "splitDistalTwist axes",
    ),
    effectorFrame: props.restFrames?.[props.chain.effector],
    rotation,
    skeleton: props.skeleton,
  });
  return {
    ...pose,
    joints: [
      ...pose.joints.filter(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone !== props.chain.lower,
      ),
      lower,
    ],
  };
}
