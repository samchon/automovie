/**
 * One weighted source star a sample's normal reads: an original source vertex
 * on one normal domain, keyed `<vertex>:<domain>`, and its preimage weight.
 *
 * @evidence contracts/common.md#principled-implementation The key joins vertex and normal domain, so opposed contact sides keep distinct stars.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The weight is the frozen preimage weight, never re-derived from positions.
 * @evidence contracts/common.md#meaningful-documentation States the key form and the weight.
 * @evidence contracts/modeling.md#shared-boundaries Both partitions key the shared samples' stars the same way, so they read one normal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The key and weight carry no unit or frame.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarWeight {
  /** The star key, `<original vertex>:<normal domain>`. */
  key: string;

  /** The sample's preimage weight on that vertex. */
  weight: number;
}
