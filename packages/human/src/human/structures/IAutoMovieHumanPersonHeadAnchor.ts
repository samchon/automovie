import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point that carries the face from the neutral frame into a shaped body: where it is in the neutral the face was built in, and where the body's shape put it. Both positions use common source metres in the Y-up/+Z-forward frame and remain borrowed by transform construction.
 *
 * The face basis is defined in an eye-centred frame (its endpoint rows are the upstream state minus that frame's shift), so the anchor is the midpoint of the body's two eye joints; carrying by another point leaves a uniform offset between the face's neck and the body's at the cut.
 *
 * @evidence contracts/common.md#principled-implementation Neutral and shaped mid-eye anchors share the face basis frame, so their difference carries the head without introducing a uniform neck offset.
 * @evidence contracts/common.md#clear-and-simple-design Two named points isolate rest-shape translation from subsequent bone rotation and posed translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The anchor follows the source's eye-centred frame convention rather than an arbitrary fitted registration point.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the mid-eye basis convention, common metre axes, borrowed operands and neutral versus shaped rest anchors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The neutral and shaped mid-eye anchor points specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the neutral and shaped mid-eye anchor points; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The neutral and shaped mid-eye anchor points acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadAnchor {
  /** The anchor in the neutral frame the face was built in. */
  neutral: IAutoMovieVector3;

  /** The anchor in the shaped body's rest. */
  shaped: IAutoMovieVector3;
}
