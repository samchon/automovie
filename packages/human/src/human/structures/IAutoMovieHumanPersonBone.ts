import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoneFrames } from "./IAutoMovieHumanPersonBoneFrames";

/**
 * One named humanoid bone of an assembled person with its rest and posed
 * world frames.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBone extends IAutoMovieHumanPersonBoneFrames {
  /** The humanoid bone name. */
  bone: AutoMovieHumanoidBone;
}
