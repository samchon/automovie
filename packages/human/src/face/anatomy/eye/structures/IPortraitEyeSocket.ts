/**
 * One subject-owned eye socket. Ordered lid curves run from negative to positive
 * local X; the component receives their identities instead of embedding them.
 *
 *
 * @evidence contracts/common.md#principled-implementation Subject-owned ordered source aperture/brow identities name one eye without embedding asset ordinals.
 * @evidence contracts/common.md#clear-and-simple-design The input owner supplies shared canthi and source order consumed by the canonical component/loop.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anatomical side remains explicit and shared endpoint/order validity stays with source admission.
 * @evidence contracts/common.md#meaningful-documentation Fields identify local X order, common canthi, non-skin gaze marker and brow boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyeSocket is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyeSocket declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyeSocket acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IPortraitEyeSocket {
  /** Anatomical side; positive host X is left. */
  name: "left" | "right";

  /** Upper aperture rim from negative X to positive X, including both corners. */
  top: number[];

  /** Lower rim in the same direction, including the same corner identities. */
  bottom: number[];

  /** Non-skin measured gaze marker. */
  iris: number;

  /** Upper brow boundary, in the same X order. */
  browTop: number[];

  /** Lower brow boundary, in the same X order. */
  browBottom: number[];
}
