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

import { DEFAULT_JOINT_AXES } from "../kinematics/DEFAULT_JOINT_AXES";
import { AutoMovieEngineKinematicsJointRotation } from "../kinematics/AutoMovieEngineKinematicsJointRotation";
import { normalizeJointAxes } from "../kinematics/internal/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import type { prepareChainFit } from "./internal/prepareChainFit";
import { resolveBoneMap } from "./internal/resolveBoneMap";
import { resolveChainEffectorBaseRotation } from "./internal/resolveChainEffectorBaseRotation";
import { resolvePreparedChainFrames } from "./internal/resolvePreparedChainFrames";
import { AutoMovieEngineMotionDistalTwist } from "./AutoMovieEngineMotionDistalTwist";

/** A distal pose and its selected solve's completed effector projection. */
export namespace AutoMovieEngineMotionChainTwist {
  /**
   * Give a distally twisting mid bone its bounded twist share before orienting
   * the effector. The existing solveDistalTwist candidate law starts from the
   * current articulation, clamps the mid joint and ranks the effector rotation
   * its shared projector will actually show. It is not a global solve over both
   * joints. Bones without distal twist return unchanged. A fit continued from a
   * seed (`near`) that carries a twist continues it (`solveDistalTwist`'s
   * `reference`), so the twist keeps its basin from frame to frame.
   *
   * The fixed effector frame includes intermediate rests and articulations.
   * Twisting leaves the effector point unchanged when the lower-to-effector
   * offset is parallel to the lower twist axis, as on the canonical limb rig; an
   * arbitrary offset does not satisfy that point-preservation premise.
   *
   * @param props The fit request.
   * @param axes Merged actual clinical axes.
   * @param pose The fitted pose.
   * @param rotation Requested model-frame effector rotation.
   * @param prepared Matching preparation with unchanged root, non-chain pose and
   *   clinical mappings.
   * @param rig Optional lazy rig of the same unchanged source workspace, sharing
   *   basis, clamps, projector and prepared fixed inverse without sharing target
   *   results.
   * @returns The pose with the mid bone's twist set within the actual rig's
   *   limits.
   */
  export function split(
    props: IAutoMovieFitChainToTargetProps,
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    pose: IAutoMoviePose,
    rotation: IAutoMovieQuaternion,
    prepared?: IAutoMoviePreparedChainPlant,
    rig?: prepareChainFit.IRig,
  ): IAutoMoviePose {
    return splitPose(props, axes, pose, rotation, prepared, rig, false).pose;
  }

  /** The ordinary split result plus one optional completed same-solve reading. */
  export interface IResult {
    /** The actual pose, with the ordinary entry's identity/array ownership. */
    pose: IAutoMoviePose;

    /** Present for a distal solve; non-distal inputs have no completed query. */
    projection: AutoMovieEngineMotionDistalTwist.IProjection | undefined;
  }

  /**
   * Run the original split and retain its winning effector projection for
   * immediate orientation under the same unchanged rig/frame/rotation inputs.
   * The consumer must recompute its actual local demand and compare all four
   * components exactly; a mismatch runs the ordinary final projection.
   *
   * Pose-only and paired entries share all FK, current lower/held reads,
   * candidates, ROM clamps and ties. Only the selected query's completed
   * effector joint/raw quaternion/local target survive beside the pose. This
   * constant reading can omit one final projector query after the exact match;
   * no speedup is measured. The immediate consumer releases it and no target
   * history, solver workspace, handles or tasks survive.
   */
  export function withProjection(
    props: IAutoMovieFitChainToTargetProps,
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    pose: IAutoMoviePose,
    rotation: IAutoMovieQuaternion,
    prepared?: IAutoMoviePreparedChainPlant,
    rig?: prepareChainFit.IRig,
  ): IResult {
    return splitPose(props, axes, pose, rotation, prepared, rig, true);
  }
}

/** Same distal law for pose-only callers and the immediate orientation consumer. */
function splitPose(
  props: IAutoMovieFitChainToTargetProps,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  pose: IAutoMoviePose,
  rotation: IAutoMovieQuaternion,
  prepared: IAutoMoviePreparedChainPlant | undefined,
  rig: prepareChainFit.IRig | undefined,
  paired: boolean,
): AutoMovieEngineMotionChainTwist.IResult {
  const lowerAxes: IAutoMovieJointAxes | undefined = axes[props.chain.lower];
  if (lowerAxes?.twistPlacement !== "distal")
    return { pose, projection: undefined };
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
  const composeLower: ReturnType<typeof AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasis> =
    AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasis(lowerBasis, lowerFrame);
  const articulated: IAutoMovieQuaternion = composeLower(current);
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    world.worldRotation,
    Quaternion.inverse(articulated),
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
  const options: Parameters<typeof AutoMovieEngineMotionDistalTwist.solve>[0] = {
    joint: current,
    effector: held,
    above,
    lowerBasis,
    lowerFrame,
    effectorRest: rest,
    readArticulated: (): IAutoMovieQuaternion => articulated,
    composeLower,
    ...(rig !== undefined && prepared !== undefined && held === rig.held()
      ? {
          readHeldRotation: (): IAutoMovieQuaternion => rig.heldRotation(),
          readHeldInverse: (): IAutoMovieQuaternion =>
            rig.heldRotationInverse(),
        }
      : {}),
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
    // A fit continued from a nearby pose's seed continues its twist.
    ...(props.near?.twist === undefined ? {} : { reference: props.near.twist }),
    ...(rig === undefined
      ? {}
      : {
          clamps: {
            lower: rig.clamp(props.chain.lower),
            effector: rig.clamp(props.chain.effector),
          },
          projectEffector: rig.effectorProjection(),
          projectEffectorWithQuaternion:
            rig.effectorProjection().withQuaternion,
          ...(prepared === undefined
            ? {}
            : { preparedEffector: rig.distalTwist() }),
        }),
  };
  const solution: AutoMovieEngineMotionDistalTwist.IResult | undefined = paired
    ? AutoMovieEngineMotionDistalTwist.withProjection(options)
    : undefined;
  const lower: IAutoMovieJointPose =
    solution?.joint ?? AutoMovieEngineMotionDistalTwist.solve(options);
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
