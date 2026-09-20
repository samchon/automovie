import { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { resolvePose } from "../kinematics/resolvePose";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * FK-resolve a pose into a bone → resolved-bone lookup. `jointAxes` /
 * `restFrames` are the same optional clinical remaps {@link resolvePose} takes:
 * omit them for the canonical clinical basis, or supply a rig's own tables when
 * the pose's clinical angles must be read through them (what the ground plant
 * and retarget contact passes do for imported/non-canonical rigs).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Resolves each effector in the same rig basis used to judge its contact target.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Produces the world-space joint state measured by the contact pass.
 */
export const resolveBoneMap = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
  new Map(
    resolvePose(pose, skeleton, jointAxes, restFrames, topology).map((bone) => [
      bone.bone,
      bone,
    ]),
  );
