import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";
import type { IAutoMovieHumanPersonHeadAnchor } from "./IAutoMovieHumanPersonHeadAnchor";

/**
 * What the head transform is built from: the face frame's anchor in the neutral and shaped bodies, and the head bone's shaped rest and posed frames.
 *
 * @evidence contracts/common.md#principled-implementation Neutral/shaped anchors and the same head bone's rest/posed frames determine the rigid placement without changing source geometry.
 * @evidence contracts/common.md#clear-and-simple-design Shape translation is isolated in the anchor while bone frames own pose, keeping the two transformations explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual bone frames supply the carry; this transport adds no consumer-specific alignment correction.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish anchor states, shaped rest frame and posed frame for the head bone.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The head anchor and bone-frame transform operands specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the head anchor and bone-frame transform operands; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The head anchor and bone-frame transform operands acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransformProps {
  /** The face frame's anchor, neutral and shaped. */
  anchor: IAutoMovieHumanPersonHeadAnchor;

  /** The head bone's shaped rest frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The head bone's posed frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
