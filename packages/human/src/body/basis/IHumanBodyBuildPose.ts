import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieHumanBodySourceRigResult } from "../anatomy/articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * One admitted body pose result shared by skin, source tissue and inspection.
 *
 * The public transform map and any anatomical graph describe the same evaluation. The skeleton and rig retain their shaped rest, while clinical coordinates report the final performed frames before root placement. Frames use right-handed body metres, +X left, +Y superior and +Z anterior; rotations are unit quaternions and clinical coordinates are degrees.
 *
 * @evidence contracts/common.md#principled-implementation Rest skeleton/rig, paired public frames, final clinical coordinates and optional anatomical FK result describe one admitted shaped-body pose evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Skin, tissue and inspection consumers share the same result instead of reconstructing frames independently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degree clinical coordinates remain distinct from scalar coupling increments and do not certify biological motion capacity.
 * @evidence contracts/common.md#meaningful-documentation Members and prose give rest/posed ownership, pre-root-placement coordinates, meter frame and unit-quaternion convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pose-result typing performs no forward kinematics or coordinate admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared result fields expose completed outputs without implementing cross-request pose caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result schema owns no acquisition/release operation for its transform map or rig arrays.
 * @author Samchon
 */
export interface IHumanBodyBuildPose {
  /** Shaped public rest skeleton used for coordinate and range admission. */
  skeleton: IAutoMovieSkeleton;

  /** Actual paired rest/posed public frames consumed by source skinning. */
  transforms: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform>;

  /** Final source-rig clinical coordinates in degrees, before root placement. */
  clinical: IAutoMovieJointPose[];

  /** Prepared rest frames, anatomical axes and signs of this same body shape. */
  rig: IAutoMovieHumanBodySkeletonRig;

  /** The same optional anatomical FK result used by source tissues and sites. */
  anatomicalRig?: IAutoMovieHumanBodySourceRigResult;
}
