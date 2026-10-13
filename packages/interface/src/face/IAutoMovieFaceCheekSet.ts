import { IAutoMovieFaceCheek } from "./IAutoMovieFaceCheek";

/**
 * The cheek pair of an {@link IAutoMovieFace}.
 *
 * When only one of `left` and `right` is stated, it applies to both cheeks as
 * the symmetric shorthand; when both are stated, each drives only its own
 * cheek. Sides are the subject's own.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` resolves each of the `R` and `L` cheek targets from its own side when stated and from the opposite side otherwise, so a lone side yields equal weights on both targets.
 * @evidence contracts/common.md#clear-and-simple-design The pair is two optional instances of the cheek record, which covers the symmetric and asymmetric cases without a third field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mirroring applies only when a side is absent and never overrides a stated side, matching the brow and eye pairs exactly.
 * @evidence contracts/common.md#meaningful-documentation States the shorthand for one stated side, the independence of two stated sides, and the subject-relative sides; members repeat when each side covers both cheeks.
 * @author Samchon
 */
export interface IAutoMovieFaceCheekSet {
  /** The subject's left cheek; applies to both cheeks when `right` is omitted. */
  left?: IAutoMovieFaceCheek;

  /** The subject's right cheek; applies to both cheeks when `left` is omitted. */
  right?: IAutoMovieFaceCheek;
}
