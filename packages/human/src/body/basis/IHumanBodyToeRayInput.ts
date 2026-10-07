import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyToePose } from "../structures/IAutoMovieHumanBodyToePose";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * What `resolveHumanBodyToeRays` reads: the basis's rays, the document's toe
 * poses, the shaped landmarks and the humanoid bones' resolved transforms.
 *
 * @author Samchon
 */
export interface IHumanBodyToeRayInput {
  /** The compiled basis, whose `toeRays` are posed. */
  basis: IAutoMovieHumanBodyBasis;

  /** The document's toe phalanx poses, if any. */
  toes: readonly IAutoMovieHumanBodyToePose[] | undefined;

  /** Shaped landmark positions by id. */
  landmarks: Record<string, IAutoMovieVector3>;

  /** Resolved humanoid bone transforms, including both toes bones. */
  transforms: ReadonlyMap<string, IAutoMovieHumanBodyBoneTransform>;
}
