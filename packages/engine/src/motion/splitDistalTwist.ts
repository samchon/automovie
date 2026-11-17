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
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import type { prepareChainFit } from "./prepareChainFit";
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
 * @param rig Optional lazy rig of the same unchanged source workspace, sharing basis, clamps, projector and prepared fixed inverse without sharing target results.
 * @returns The pose with the mid bone's twist set within the actual rig's limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current-pose reference, bounded actual displayed ranking, fixed intermediate frame and point-preservation premise. withProjection's child documentation defines same-input scope, original pose ownership, optional selected actual local/joint/raw-quaternion reading and exact-demand fallback.
 * @evidence contracts/development/implementation.md#principled-implementation The lower world rotation factors into its preceding frame and articulation; removing the latter gives the frame solveDistalTwist needs. A distal twist preserves the effector point only for an offset parallel to its axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Ordinary and withProjection entries share one private split and the same standalone/prepared FK and bounded solve. Paired mode retains only its winning actual projection for orientChainEffector; standalone authored admission still precedes frame recovery.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Actual ROM bounds the twist and the shared projector reports any remaining effector miss. Neither the five-candidate law nor arbitrary intermediate offsets are claimed to guarantee a full pose target.
 * @evidence contracts/development/implementation.md#efficient-algorithms A distal call has O(J) authored-frame and last-record scans and joint-array copying; actual B-bone lookups and projector setup are shared by a supplied workspace rig, or add O(B) standalone work; preparation uses chain FK, while standalone adds full FK and bounded ancestry checks. At most five distinct twists query the projector. Each eligible query scores its reference plus at most eighteen pairs, at most nineteen actual joint recompositions; unsupported queries keep the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions each. A non-distal lower returns immediately; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source frames, admitted bases/clamps/projector, fixed inverse/effector readings and exact lower-axis factors share only matching unchanged inputs; source-held raw still reads before its shared inverse and last records retain full-FK meaning. withProjection additionally returns this solve's actual winning effector joint/raw composition/local target. Immediate orientation recomputes its actual local demand and reuses only four-component Object.is equality under identical fixed projector dependencies; no target or seed crosses operations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Pose-specific frames/closures release with the call and the pose owns its new joint array. Paired mode adds one result wrapper and one selected fixed-size reading only until immediate orientation; borrowed source rig/projector remain caller-owned, with no target history, handles or tasks.
 */
export function splitDistalTwist(
  props: IAutoMovieFitChainToTargetProps,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  pose: IAutoMoviePose,
  rotation: IAutoMovieQuaternion,
  prepared?: IAutoMoviePreparedChainPlant,
  rig?: prepareChainFit.IRig,
): IAutoMoviePose {
  return split(props, axes, pose, rotation, prepared, rig, false).pose;
}

/** Same distal law for pose-only callers and the immediate orientation consumer. */
function split(
  props: IAutoMovieFitChainToTargetProps,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  pose: IAutoMoviePose,
  rotation: IAutoMovieQuaternion,
  prepared: IAutoMoviePreparedChainPlant | undefined,
  rig: prepareChainFit.IRig | undefined,
  paired: boolean,
): splitDistalTwist.IResult {
  const lowerAxes: IAutoMovieJointAxes | undefined = axes[props.chain.lower];
  if (lowerAxes?.twistPlacement !== "distal") return { pose, projection: undefined };
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
      : resolvePreparedChainFrames.lower({
          prepared,
          joints: pose.joints,
          jointAxes: axes,
          restFrames: props.restFrames,
          ...(rig === undefined ? {} : { rig }),
        });
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
  const lowerBasis: IAutoMovieJointAxes =
    rig?.basis(props.chain.lower, "splitDistalTwist axes") ??
    normalizeJointAxes(lowerAxes, "splitDistalTwist axes");
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const composeLower: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
    jointToQuaternionOnBasis.prepare(lowerBasis, lowerFrame);
  const articulated: IAutoMovieQuaternion = composeLower(current);
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    world.worldRotation, Quaternion.inverse(articulated),
  );
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
          world,
          map.get(props.chain.effector)!,
        )
      : (effectorBone?.rest.rotation ?? Quaternion.identity()));
  const options: Parameters<typeof solveDistalTwist>[0] = {
    joint: current,
    effector: held,
    above,
    lowerBasis,
    lowerFrame,
    effectorRest: rest,
    readArticulated: (): IAutoMovieQuaternion => articulated,
    composeLower,
    ...(rig !== undefined && prepared !== undefined && held === rig.held() ? {
      readHeldRotation: (): IAutoMovieQuaternion => rig.heldRotation(),
      readHeldInverse: (): IAutoMovieQuaternion => rig.heldRotationInverse(),
    } : {}),
    effectorRestInverse:
      (prepared === undefined ? undefined : rig?.effectorRestInverse()) ??
      Quaternion.inverse(rest),
    effectorBasis:
      rig?.basis(props.chain.effector, "splitDistalTwist axes") ??
      normalizeJointAxes(
        axes[props.chain.effector] ?? DEFAULT_JOINT_AXES,
        "splitDistalTwist axes",
      ),
    effectorFrame: props.restFrames?.[props.chain.effector],
    rotation,
    skeleton: props.skeleton,
    ...(rig === undefined
      ? {}
      : {
          clamps: {
            lower: rig.clamp(props.chain.lower),
            effector: rig.clamp(props.chain.effector),
          },
          projectEffector: rig.effectorProjection(),
          projectEffectorWithQuaternion: rig.effectorProjection().withQuaternion,
          ...(prepared === undefined ? {} : { preparedEffector: rig.distalTwist() }),
        }),
  };
  const solution: solveDistalTwist.IResult | undefined =
    paired ? solveDistalTwist.withProjection(options) : undefined;
  const lower: IAutoMovieJointPose = solution?.joint ?? solveDistalTwist(options);
  return {
    pose: {
      ...pose,
      joints: [
        ...pose.joints.filter(
          (joint: IAutoMovieJointPose): boolean =>
            joint.bone !== props.chain.lower,
        ),
        lower,
      ],
    },
    projection: solution?.projection,
  };
}

/**
 * A distal pose and its selected solve's completed effector projection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original pose ownership and the optional actual local projection from the same distal solve.
 * @evidence contracts/development/design.md#principled-representation An actual lower articulation and its scored effector projection belong to one bounded distal choice; a non-distal pose has no such projection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface orientChainEffector needs the split pose and may reuse its projection only after reconstructing an exactly identical local demand under matching dependencies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No continuation seed, target history, approximate local key or achieved-point replacement is represented; absent projection means the caller still performs its ordinary projection.
 */
export namespace splitDistalTwist {
  /** The ordinary split result plus one optional completed same-solve reading. */
  export interface IResult {
    /** The actual pose, with the ordinary entry's identity/array ownership. */
    pose: IAutoMoviePose;

    /** Present for a distal solve; non-distal inputs have no completed query. */
    projection: solveDistalTwist.IProjection | undefined;
  }

  /**
   * Run the original split and retain its winning effector projection for
   * immediate orientation under the same unchanged rig/frame/rotation inputs.
   * The consumer must recompute its actual local demand and compare all four
   * components exactly; a mismatch runs the ordinary final projection.
   *
   * Pose-only and paired entries share all FK, current lower/held reads,
   * candidates, ROM clamps and ties. Only the selected query's completed
   * effector joint/raw quaternion/local target survive beside the pose.
   * This constant reading can omit one final projector query after the exact
   * match; no speedup is measured. The immediate consumer releases it and
   * no target history, solver workspace, handles or tasks survive.
   */
  export function withProjection(
    props: IAutoMovieFitChainToTargetProps,
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    pose: IAutoMoviePose,
    rotation: IAutoMovieQuaternion,
    prepared?: IAutoMoviePreparedChainPlant,
    rig?: prepareChainFit.IRig,
  ): IResult {
    return split(props, axes, pose, rotation, prepared, rig, true);
  }
}
