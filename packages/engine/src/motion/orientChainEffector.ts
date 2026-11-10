import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { resolveBoneMap } from "./resolveBoneMap";
import { splitDistalTwist } from "./splitDistalTwist";

/**
 * Turn the fitted chain's effector to a requested model-frame rotation: its
 * local articulation is the lower bone's world rotation undone, then its
 * rest rotation undone, read back as clinical angles through the same axes
 * and rest frames and clamped to the rig's range of motion.
 *
 * Clamping one angle of an Euler decomposition is not the nearest reachable
 * rotation: an immobile axis (a wrist's or an ankle's twist) zeroed after the
 * decomposition leaves its share as error on the other axes, so a foot asked
 * to pitch and turn keeps a roll its eversion could have removed. When the
 * clamp moves the joint, the effector's mobile axes are therefore refined to
 * the rotation nearest the request inside the range, by cyclic coordinate
 * descent on the geodesic angle (each axis in turn minimised by
 * golden-section search over its admitted range, four sweeps), the standard
 * projection of a target rotation onto a joint's reachable set (Baerlocher and
 * Boulic 2001 treat joint limits the same way, as a constrained minimisation
 * rather than a per-axis clip). A rotation the joint can reach is left as the
 * decomposition gives it.
 *
 * @param props The fit request; without `effectorRotation` the pose returns unchanged.
 * @param fitted The fitted pose.
 * @returns The pose with the effector oriented.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the twist split first, the effector's local articulation, the decomposition, the clamp and when and how the clamped joint is refined.
 * @evidence contracts/development/implementation.md#principled-implementation The effector's local rotation is the mid bone's world rotation and the effector's rest undone from the request, read back as clinical angles; a clamped joint is projected onto its range by minimising the geodesic angle to the request (Baerlocher and Boulic 2001), and a distal twist share is moved first by splitDistalTwist.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics, one decomposition and one clamp after the twist split, with the refinement only when the clamp moves the joint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable rotation is brought to its nearest reachable rotation inside the range, never reported as reached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two forward kinematics passes, linear in bones; a refinement adds a fixed 4 sweeps of 40 golden-section steps per mobile axis on quaternions.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function orientChainEffector(
  props: IFitChainToTargetProps,
  fitted: IAutoMoviePose,
): IAutoMoviePose {
  if (props.effectorRotation === undefined) return fitted;
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(props.skeleton, props.jointAxes);
  const pose: IAutoMoviePose = splitDistalTwist(
    props,
    axes,
    fitted,
    props.effectorRotation,
  );
  const lower: IAutoMovieResolvedBone = resolveBoneMap(
    props.skeleton,
    pose,
    props.topology,
    axes,
    props.restFrames,
  ).get(props.chain.lower)!;
  const rest: IAutoMovieQuaternion =
    props.skeleton.bones.find(
      (b: (typeof props.skeleton.bones)[number]): boolean =>
        b.bone === props.chain.effector,
    )?.rest.rotation ?? Quaternion.identity();
  const local: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(rest),
      Quaternion.multiply(
        Quaternion.inverse(lower.worldRotation),
        props.effectorRotation,
      ),
    ),
  );
  const effectorAxes: IAutoMovieJointAxes | undefined =
    axes[props.chain.effector];
  const frame = props.restFrames?.[props.chain.effector];
  const angles: ReturnType<typeof decomposeJointRotation> =
    decomposeJointRotation(local, effectorAxes, frame);
  const raw: IAutoMovieJointPose = {
    bone: props.chain.effector,
    flexion: angles.flexion,
    abduction: angles.abduction,
    twist: angles.twist,
  };
  let effector: IAutoMovieJointPose = clampJointToSkeleton(raw, props.skeleton);

  // The clamp moved the joint: refine its mobile axes to the nearest
  // reachable rotation.
  const moved: boolean = (["flexion", "abduction", "twist"] as const).some(
    (k: "flexion" | "abduction" | "twist"): boolean =>
      Math.abs((effector[k] ?? 0) - (raw[k] ?? 0)) > 1e-9,
  );
  if (moved) {
    const error = (joint: IAutoMovieJointPose): number => {
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        jointToQuaternion(joint, effectorAxes, frame),
      );
      return (
        1 -
        Math.abs(q.x * local.x + q.y * local.y + q.z * local.z + q.w * local.w)
      );
    };
    const span = (
      k: "flexion" | "abduction" | "twist",
    ): [number, number] | null => {
      const low: number | null = clampJointToSkeleton(
        { ...effector, [k]: -1e6 },
        props.skeleton,
      )[k];
      const high: number | null = clampJointToSkeleton(
        { ...effector, [k]: 1e6 },
        props.skeleton,
      )[k];
      if (low === null || high === null || !(high - low > 1e-9)) return null;
      return [Math.max(low, -180), Math.min(high, 180)];
    };
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    for (let sweep: number = 0; sweep < 4; sweep++)
      for (const k of ["flexion", "abduction", "twist"] as const) {
        const range: [number, number] | null = span(k);
        if (range === null) continue;
        const at = (v: number): IAutoMovieJointPose =>
          clampJointToSkeleton({ ...effector, [k]: v }, props.skeleton);
        let [lo, hi] = range;
        let c: number = hi - ratio * (hi - lo);
        let d: number = lo + ratio * (hi - lo);
        let fc: number = error(at(c));
        let fd: number = error(at(d));
        for (let i: number = 0; i < 40; i++) {
          if (fc <= fd) {
            hi = d;
            d = c;
            fd = fc;
            c = hi - ratio * (hi - lo);
            fc = error(at(c));
          } else {
            lo = c;
            c = d;
            fc = fd;
            d = lo + ratio * (hi - lo);
            fd = error(at(d));
          }
        }
        const candidate: IAutoMovieJointPose = at((lo + hi) / 2);
        if (error(candidate) < error(effector)) effector = candidate;
      }
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
