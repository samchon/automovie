import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../../kinematics/internal/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { getConstraint } from "../../rom/internal/getConstraint";
import { basisOf } from "./basisOf";
import type { prepareChainFit } from "./prepareChainFit";
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { AutoMovieEngineClinicalAngle } from "../../rom/internal/AutoMovieEngineClinicalAngle";
import { AutoMovieEngineMotionDistalTwist } from "../AutoMovieEngineMotionDistalTwist";
import { AutoMovieEngineMotionJointProjection } from "../AutoMovieEngineMotionJointProjection";

/*
 * Prepare the actual displayed rotation error, degrees, of hinged candidates.
 * Each lower candidate takes the same bounded distal-twist choice as the final
 * fit; its effector then uses the same quaternion projection as orientation.
 * The world rotation is recomposed through the preparation's entire fixed
 * lower-to-effector frame, including intermediate bones, before its geodesic
 * error is read. No small miss or unchanged Euler clamp is replaced by zero.
 * Parameter props: The fit request under unchanged pose, rig and clinical mappings.
 * Parameter prepared: The matching chain preparation.
 * Parameter axes: The mid bone's axes, below any skeleton-declared override.
 * Parameter rotation: Requested model-frame effector rotation.
 * Parameter rig: Optional lazy workspace rig under the same source, prepared frames
 * and clinical mappings; target results remain scorer-local.
 * Returns: A per-fit scorer of bone-local upper/lower rotations. Keep each
 * candidate unchanged through its synchronous call; scalar edits between
 * calls are reread. Its optional third input is the exact completed (prepared
 * upper world * this upper) * fixed lower frame for the same candidate.
 */
export function fitHingedRotationError(
  props: IAutoMovieFitChainToTargetProps,
  prepared: NonNullable<IAutoMoviePreparedChainPlant | null>,
  axes: IAutoMovieJointAxes,
  rotation: IAutoMovieQuaternion,
  rig?: prepareChainFit.IRig,
): (
  upper: IAutoMovieQuaternion,
  lower: IAutoMovieQuaternion,
  preparedAbove?: IAutoMovieQuaternion,
) => number {
  const effector: AutoMovieHumanoidBone = props.chain.effector;
  const effectorBone: IAutoMovieBone | undefined =
    rig === undefined
      ? props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === effector,
        )
      : rig.bone(effector);
  const rest: IAutoMovieQuaternion = prepared.effectorBaseRotation;
  const lowerBasis: IAutoMovieJointAxes =
    rig?.basis(props.chain.lower, "decomposeJointRotation axes") ??
    basisOf(
      props.skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.bone === props.chain.lower,
      )?.axes ?? axes,
    );
  const effectorBasis: IAutoMovieJointAxes =
    rig?.basis(effector, "decomposeJointRotation axes") ??
    basisOf(effectorBone?.axes ?? props.jointAxes?.[effector]);
  const wanted: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(rotation);
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const effectorFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[effector];
  let held: IAutoMovieJointPose = rig?.held() ?? {
    bone: effector,
    flexion: null,
    abduction: null,
    twist: null,
  };
  if (rig === undefined)
    for (const joint of props.pose.joints)
      if (joint.bone === effector) held = joint;
  const clampLower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    rig?.clamp(props.chain.lower) ??
    AutoMovieEngineKinematics.clampJointToSkeletonOf(
      props.chain.lower,
      props.skeleton,
    );
  const clampEffector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    rig?.clamp(effector) ??
    AutoMovieEngineKinematics.clampJointToSkeletonOf(effector, props.skeleton);
  const project: AutoMovieEngineMotionJointProjection.IProjector =
    rig?.effectorProjection() ??
    AutoMovieEngineMotionJointProjection.prepare({
      domain: {
        bone: effector,
        constraint: getConstraint(effector, effectorBone?.constraint ?? null),
      },
      basis: effectorBasis,
      frame: effectorFrame,
      clamp: clampEffector,
    });
  const restInverse: IAutoMovieQuaternion =
    rig?.effectorRestInverse() ?? AutoMovieEngineQuaternion.inverse(rest);
  const clamps: NonNullable<
    AutoMovieEngineMotionDistalTwist.IProps["clamps"]
  > = {
    lower: clampLower,
    effector: clampEffector,
  };

  // Own the successful scalar snapshot, so reused caller records can change
  // between queries and a failed conversion cannot mark old data as current.
  let lowerComponents: readonly [number, number, number, number] | undefined;
  let lowerJoint: IAutoMovieJointPose | undefined;
  let clamped: IAutoMovieQuaternion | undefined;
  let heldRotation: IAutoMovieQuaternion | undefined;
  let heldInverse: IAutoMovieQuaternion | undefined;
  let composeLower:
    | ReturnType<typeof jointToQuaternionOnBasis.prepare>
    | undefined;
  let preparedEffector: AutoMovieEngineMotionDistalTwist.IPrepared | undefined;

  /*
   * Share pure lower-axis factors only inside this target's scorer.
   */
  const lowerRotation: ReturnType<typeof jointToQuaternionOnBasis.prepare> = (
    joint: Parameters<ReturnType<typeof jointToQuaternionOnBasis.prepare>>[0],
  ): IAutoMovieQuaternion => {
    composeLower ??= jointToQuaternionOnBasis.prepare(lowerBasis, lowerFrame);
    return composeLower(joint);
  };

  /*
   * Prepare lazy raw readers once for this immutable lower record.
   */
  const prepareLowerReadings: (
    joint: IAutoMovieJointPose,
  ) => Pick<
    AutoMovieEngineMotionDistalTwist.IProps,
    "readArticulated" | "readUntwisted"
  > = (
    joint: IAutoMovieJointPose,
  ): Pick<
    AutoMovieEngineMotionDistalTwist.IProps,
    "readArticulated" | "readUntwisted"
  > => {
    let articulated: IAutoMovieQuaternion | undefined;
    let untwisted: IAutoMovieQuaternion | undefined;
    return {
      readArticulated: (): IAutoMovieQuaternion => {
        if (articulated === undefined) articulated = lowerRotation(joint);
        return articulated;
      },
      readUntwisted: (): IAutoMovieQuaternion => {
        if (untwisted === undefined)
          untwisted = lowerRotation({
            ...joint,
            twist: AutoMovieEngineClinicalAngle.toClinicalAngle(
              0,
              lowerFrame?.twist,
            ),
          });
        return untwisted;
      },
    };
  };
  let lowerReadings: ReturnType<typeof prepareLowerReadings> | undefined;

  /*
   * Read source-only held rotation at the solver's original first-use site.
   */
  const readHeldRotation: () => IAutoMovieQuaternion =
    (): IAutoMovieQuaternion => {
      if (rig !== undefined) return rig.heldRotation();
      if (heldRotation === undefined)
        heldRotation = AutoMovieEngineQuaternion.multiply(
          rest,
          jointToQuaternionOnBasis.run(held, effectorBasis, effectorFrame),
        );
      return heldRotation;
    };

  /*
   * The actual held raw was read first; share only its unchanged inverse.
   */
  const readHeldInverse: (raw: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    raw: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    if (rig !== undefined) return rig.heldRotationInverse();
    if (heldInverse === undefined) heldInverse = AutoMovieEngineQuaternion.inverse(raw);
    return heldInverse;
  };
  return (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    preparedAbove?: IAutoMovieQuaternion,
  ): number => {
    const above: IAutoMovieQuaternion =
      preparedAbove ??
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.multiply(prepared.upper.worldRotation, upper),
        prepared.lowerRotation,
      );
    const x: number = lower.x;
    const y: number = lower.y;
    const z: number = lower.z;
    const w: number = lower.w;
    if (
      lowerJoint === undefined ||
      lowerComponents === undefined ||
      !Object.is(lowerComponents[0], x) ||
      !Object.is(lowerComponents[1], y) ||
      !Object.is(lowerComponents[2], z) ||
      !Object.is(lowerComponents[3], w)
    ) {
      const angles: IAutoMovieResolvedJointAngles =
        decomposeJointRotationOnBasis.run(
          lower,
          lowerBasis,
          lowerFrame,
          prepared.lowerDomain,
        );
      const admitted: IAutoMovieJointPose = {
        bone: props.chain.lower,
        ...angles,
      };
      const nextClamped: IAutoMovieQuaternion | undefined =
        lowerBasis.twistPlacement === "distal"
          ? undefined
          : lowerRotation(clampLower({ ...admitted }));
      lowerJoint = admitted;
      lowerReadings = undefined;
      clamped = nextClamped;
      lowerComponents = [x, y, z, w];
    }
    const joint: IAutoMovieJointPose = lowerJoint;
    let projected: AutoMovieEngineMotionDistalTwist.IProjection | undefined;
    let lowerRotationResult: IAutoMovieQuaternion | undefined = clamped;
    if (lowerRotationResult === undefined) {
      const result: AutoMovieEngineMotionDistalTwist.IResult =
        AutoMovieEngineMotionDistalTwist.withProjection({
        joint,
        effector: held,
        above,
        lowerBasis,
        lowerFrame,
        effectorRest: rest,
        effectorRestInverse: restInverse,
        effectorBasis,
        effectorFrame,
        rotation,
        skeleton: props.skeleton,
        ...(props.near?.twist === undefined
          ? {}
          : { reference: props.near.twist }),
        clamps,
        projectEffector: project,
        projectEffectorWithQuaternion: project.withQuaternion,
        composeLower: lowerRotation,
        preparedEffector: (preparedEffector ??=
          rig?.distalTwist() ??
          AutoMovieEngineMotionDistalTwist.prepare({
            effectorRest: rest,
            effectorBasis,
            effectorFrame,
          })),
        ...(lowerReadings ??= prepareLowerReadings(joint)),
        readHeldRotation,
        readHeldInverse,
      });
      lowerRotationResult = lowerRotation(result.joint);
      projected = result.projection;
    }
    const mid: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      above,
      lowerRotationResult,
    );
    const local: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(
        restInverse,
        AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.inverse(mid), rotation),
      ),
    );
    // The selected distal score already projected this exact demand. The
    // actual clamped lower joint is recomposed; reuse only component equality,
    // since it may differ from the raw articulation used by a score.
    const selected: IAutoMovieQuaternion =
      projected !== undefined &&
      Object.is(projected.local.x, local.x) &&
      Object.is(projected.local.y, local.y) &&
      Object.is(projected.local.z, local.z) &&
      Object.is(projected.local.w, local.w)
        ? projected.quaternion
        : project.withQuaternion(local).quaternion;
    const shown: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.multiply(mid, rest),
      selected,
    );
    return (AutoMovieEngineQuaternion.angleAfterNormalize(shown, wanted) * 180) / Math.PI;
  };
}
