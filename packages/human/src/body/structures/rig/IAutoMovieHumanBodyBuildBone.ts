import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "./IAutoMovieHumanBodyBoneTransform";

/**
 * One named humanoid bone's paired world placements in an evaluated body.
 * Its identity accompanies the existing transform pair for rig inspection
 * and person transport; it does not turn a rig frame into bone geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBuildBone extends IAutoMovieHumanBodyBoneTransform {
  /** Existing humanoid identity whose world placements are recorded. */
  bone: AutoMovieHumanoidBone;
}
