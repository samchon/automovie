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
 * The public transform map and any anatomical graph describe the same
 * evaluation. The skeleton and rig retain their shaped rest, while clinical
 * coordinates report the final performed frames before root placement.
 * Frames use right-handed body metres, +X left, +Y superior and +Z anterior;
 * rotations are unit quaternions and clinical coordinates are degrees.
 *
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
