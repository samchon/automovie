import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyToePose } from "../structures/IAutoMovieHumanBodyToePose";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * What `resolveHumanBodyToeRays` reads: the basis's rays, the document's toe poses, the shaped landmarks and the humanoid bones' resolved transforms.
 *
 * @evidence contracts/common.md#principled-implementation Compiled toe-ray definitions, optional admitted phalanx poses, shaped landmarks and current humanoid transforms supply one source-corresponding toe evaluation.
 * @evidence contracts/common.md#clear-and-simple-design The toe-ray owner receives existing basis/document/frame dependencies without reauthoring public bone transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted toe poses provide no invented phalanx motion and landmarks/transforms must describe the same shaped source.
 * @evidence contracts/common.md#meaningful-documentation Members state compiled ray ownership, pose omission, named landmarks and required toes-bone frames.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Toe-ray input typing performs no phalanx FK or toe split generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matching basis/frame dependencies define evaluation identity without owning a cross-pose ray cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The borrowed toe context acquires no phalange transforms, split-weight buffers or running motion task.
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
