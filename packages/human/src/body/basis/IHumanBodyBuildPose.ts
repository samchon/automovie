import type { IAutoMovieJointPose, IAutoMovieSkeleton, AutoMovieHumanoidBone } from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Keeps the prepared rest rig, final public placements and optional source graph together so consumers do not solve another pose.
 * @evidence contracts/common.md#clear-and-simple-design Names the existing pose result and its optional anatomical source evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest and performed frames stay distinct; source bone frames are not substituted for anatomical solids or clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation States state ownership, final-coordinate meaning and the frame before root placement.
 * @evidence contracts/modeling.md#spatial-conventions Body XYZ metres and unit quaternions accompany the source-rig degree coordinates without a conversion here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record carries evaluated rig identities rather than defining geometry parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document and source joint owners define motion channels; this record carries their evaluated result.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No primitive population is selected here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No surface or volume boundary is constructed here.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body assembly observes the performed parts; the numerical result has no independent render.
 * @evidence contracts/anatomy.md#anatomical-source Clinical coordinates describe this compiled source rig; source registration and approximation accounts do not establish measured personal motion capacity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The pose resolver admits coordinates and combinations before publishing this result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is evaluated internal state, not a public measurement or motion input.
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
