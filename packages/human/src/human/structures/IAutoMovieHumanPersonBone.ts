import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoneFrames } from "./IAutoMovieHumanPersonBoneFrames";

/**
 * One named humanoid bone of an assembled person with its rest and posed
 * world frames.
 *
 * @evidence contracts/common.md#principled-implementation A rig bone is its humanoid name plus its two frames.
 * @evidence contracts/common.md#clear-and-simple-design Adds one field to the bone frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names come from the humanoid vocabulary; an unmapped owner is refused upstream, never guessed.
 * @evidence contracts/common.md#meaningful-documentation States what the bone adds.
 * @evidence contracts/modeling.md#part-identity-and-grouping Bones are named from the humanoid vocabulary.
 * @evidenceExclude contracts/modeling.md#parameter-channels A bone is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A bone emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Inherits metres, Y up, +Z forward.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A bone builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A bone is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A bone carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range A bone admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A bone is derived, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBone extends IAutoMovieHumanPersonBoneFrames {
  /** The humanoid bone name. */
  bone: AutoMovieHumanoidBone;
}
