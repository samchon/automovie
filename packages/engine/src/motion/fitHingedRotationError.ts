import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { basisOf } from "./basisOf";
import type { prepareChainPlant } from "./prepareChainPlant";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Prepare the actual displayed rotation error, degrees, of hinged candidates.
 * Each lower candidate takes the same bounded distal-twist choice as the final
 * fit; its effector then uses the same quaternion projection as orientation.
 * The world rotation is recomposed through the preparation's entire fixed
 * lower-to-effector frame, including intermediate bones, before its geodesic
 * error is read. No small miss or unchanged Euler clamp is replaced by zero.
 *
 * @param props The fit request under unchanged pose, rig and clinical mappings.
 * @param prepared The matching chain preparation.
 * @param axes The mid bone's axes, below any skeleton-declared override.
 * @param rotation Requested model-frame effector rotation.
 * @returns A per-fit scorer of bone-local upper and lower rotations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines degree-valued displayed error, fixed intermediate frame, shared final split/projection, immutable fit premises and actual residual reporting.
 * @evidence contracts/development/implementation.md#principled-implementation Prepared FK composes upper/lower candidate rotations and the actual fixed effector frame; solveDistalTwist and prepareJointRotationProjection are the final display's same owners, and Quaternion.angle reads the actual shown quaternion against the request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Per-fit bases, clamps and projection precede one candidate closure. It reads lower angles once per shared quaternion record, applies the shared split and projection, and scores the shown world rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Skeleton axes/ROM and the last authored effector match full FK. No forced-zero residual or claim that the five distal candidates globally solve the combined joints replaces actual composition.
 * @evidence contracts/development/implementation.md#efficient-algorithms Setup scans the B bones and J authored joints and prepares one shared projector, O(B+J) work. A non-distal candidate queries it once; a distal candidate has at most five twist-score queries plus one final displayed query, at most six. Each eligible query recomposes the reference plus at most eighteen pairs, at most nineteen actual joint scores or 114 across six queries; unsupported queries retain the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions per query. Chain FK and final world-error composition remain additional constant work; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One fit reuses admitted bases, resolved clamps, fixed frame inverse and effector projection; identical lower quaternion records reuse their inverse reading. Rig, frame or non-chain-pose changes require a new scorer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning fit releases the closure, its borrowed rig/preparation, projection and one-entry lower cache together; the cache never grows with candidate count and no global resource is acquired.
 */
export function fitHingedRotationError(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  rotation: IAutoMovieQuaternion,
): (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => number {
  const effector: AutoMovieHumanoidBone = props.chain.effector;
  const effectorBone: IAutoMovieBone | undefined = props.skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === effector,
  );
  const rest: IAutoMovieQuaternion = prepared.effectorBaseRotation;
  const lowerBasis: IAutoMovieJointAxes = basisOf(
    props.skeleton.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === props.chain.lower,
    )?.axes ?? axes,
  );
  const effectorBasis: IAutoMovieJointAxes = basisOf(
    effectorBone?.axes ?? props.jointAxes?.[effector],
  );
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const effectorFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[effector];
  let held: IAutoMovieJointPose = {
    bone: effector,
    flexion: null,
    abduction: null,
    twist: null,
  };
  for (const joint of props.pose.joints)
    if (joint.bone === effector) held = joint;
  const clampLower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    clampJointToSkeleton.of(props.chain.lower, props.skeleton);
  const clampEffector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    clampJointToSkeleton.of(effector, props.skeleton);
  const project: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose =
    prepareJointRotationProjection({
      domain: {
        bone: effector,
        constraint: getConstraint(effector, effectorBone?.constraint ?? null),
      },
      basis: effectorBasis,
      frame: effectorFrame,
      clamp: clampEffector,
    });
  const restInverse: IAutoMovieQuaternion = Quaternion.inverse(rest);

  // Bend candidates can share one immutable lower quaternion record.
  let seen: IAutoMovieQuaternion | undefined;
  let angles: IAutoMovieResolvedJointAngles | undefined;
  let clamped: IAutoMovieQuaternion | undefined;
  return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): number => {
    const above: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(prepared.upper.worldRotation, upper),
      prepared.lowerRotation,
    );
    if (seen !== lower || angles === undefined) {
      seen = lower;
      angles = decomposeJointRotationOnBasis(
        lower,
        lowerBasis,
        lowerFrame,
        prepared.lowerDomain,
      );
      clamped =
        lowerBasis.twistPlacement === "distal"
          ? undefined
          : jointToQuaternionOnBasis(
              clampLower({ bone: props.chain.lower, ...angles }),
              lowerBasis,
              lowerFrame,
            );
    }
    const read: IAutoMovieResolvedJointAngles = angles;
    const joint: IAutoMovieJointPose = { bone: props.chain.lower, ...read };
    const mid: IAutoMovieQuaternion = Quaternion.multiply(
      above,
      clamped ??
        jointToQuaternionOnBasis(
          solveDistalTwist({
            joint,
            effector: held,
            above,
            lowerBasis,
            lowerFrame,
            effectorRest: rest,
            effectorBasis,
            effectorFrame,
            rotation,
            skeleton: props.skeleton,
            clamps: { lower: clampLower, effector: clampEffector },
            projectEffector: project,
          }),
          lowerBasis,
          lowerFrame,
        ),
    );
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        restInverse,
        Quaternion.multiply(Quaternion.inverse(mid), rotation),
      ),
    );
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(mid, rest),
      jointToQuaternionOnBasis(project(local), effectorBasis, effectorFrame),
    );
    return (
      (Quaternion.angle(Quaternion.normalize(shown), wanted) * 180) / Math.PI
    );
  };
}
