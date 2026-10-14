import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";

/**
 * Pair the same bone's rest and performed world frames in common metre Y-up/+Z-forward coordinates. The pose operator interprets their relation; rest does not imply identity orientation or absence of source shape-dependent shoulder rest. The record carries source rig state without independently validating correspondence, unit quaternions or clinical anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Distinct canonical rest/posed frames preserve the actual operands used by bone transport rather than replacing source rest with identity.
 * @evidence contracts/common.md#clear-and-simple-design Both members use one frame schema; bone identity and transform evaluation remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal record shape is not correspondence/clinical proof, and rest frames are not silently treated as identity transforms.
 * @evidence contracts/common.md#meaningful-documentation Prose states shared metre axes, rest versus performed meaning and shape-dependent rest/validation boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This frame-pair declaration executes no rest-to-pose transform or skin evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Concrete build owners share frame pairs across vertices; this carrier implements no transform cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring two frames acquires no source task or skeleton resource; the containing build/caller owns actual frame storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrames {
  /** The rest world frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The posed world frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
