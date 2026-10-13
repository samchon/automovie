import { IAutoMovieFaceBrow } from "./IAutoMovieFaceBrow";

/**
 * The eyebrow pair of an {@link IAutoMovieFace}.
 *
 * When only one of `left` and `right` is stated, it applies to both brows as
 * the symmetric shorthand; when both are stated, each side stands alone, which
 * is how a single raised brow is written. Sides are the subject's own.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` emits `browHeightR` from `right` and `browHeightL` from `left`, substituting the other side only when one side is absent, so two stated sides never influence each other.
 * @evidence contracts/common.md#clear-and-simple-design Two optional sides of one brow type express symmetric and asymmetric brows with no separate symmetric field and no flag choosing between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The lone-side mirroring is the one stated rule for every paired feature, applied identically to eyes and cheeks; no side or trait is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the lone-side shorthand, the independence of two stated sides, and whose left and right is meant; members restate when each side applies to both.
 * @author Samchon
 */
export interface IAutoMovieFaceBrowSet {
  /** The subject's left brow; applies to both brows when `right` is omitted. */
  left?: IAutoMovieFaceBrow;

  /** The subject's right brow; applies to both brows when `left` is omitted. */
  right?: IAutoMovieFaceBrow;
}
