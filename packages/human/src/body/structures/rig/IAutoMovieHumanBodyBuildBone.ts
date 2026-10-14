import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "./IAutoMovieHumanBodyBoneTransform";

/**
 * One named humanoid bone's paired world placements in an evaluated body.
 * Its identity accompanies the existing transform pair for rig inspection
 * and person transport; it does not turn a rig frame into bone geometry.
 *
 * @evidence contracts/common.md#principled-implementation A closed humanoid identity accompanies the inherited rest and posed frame pair in an evaluated body.
 * @evidence contracts/common.md#clear-and-simple-design Extending the transform pair preserves its frame representation while adding inspection identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The added name does not convert a rig transform into anatomical bone geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies transport and inspection use and explicitly limits anatomical meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The identified build bone record declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The identified build bone record declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The identified build bone record type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBuildBone extends IAutoMovieHumanBodyBoneTransform {
  /** Existing humanoid identity whose world placements are recorded. */
  bone: AutoMovieHumanoidBone;
}
