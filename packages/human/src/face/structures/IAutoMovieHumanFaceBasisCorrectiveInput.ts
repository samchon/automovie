/**
 * One driving side of a combination corrective: a channel, which of its two
 * endpoints the corrective answers for, and the optional in-between tent over
 * that driver's weight (`IAutoMovieHumanFaceBasis.correctives`).
 *
 * @evidence contracts/common.md#principled-implementation One driver's fields, extracted from the corrective declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A channel, a side and an optional tent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An in-between is an authored tent, not an inferred correction.
 * @evidence contracts/common.md#meaningful-documentation States the tent, its defaults and why neighbouring peaks bound it.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds names and dimensionless weights, no coordinate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the evaluated face is observed by its owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis declaration cites the sources of the model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of the basis bounds these values; the record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is basis data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisCorrectiveInput {
  /** The driving channel's id. */
  channel: string;
  /** Which endpoint of that channel this corrective answers for. */
  side: "positive" | "negative";

  /**
   * The driver weight this input is fully present at, in (0,1]; omitted
   * is 1. Below it the factor rises linearly from zero at `between[0]`;
   * above it, when the peak is under one, it falls linearly to zero at
   * `between[1]`, so an in-between corrective is absent from the full
   * pose it was not solved for.
   */
  peak?: number;

  /**
   * The driver weights on either side of the peak at which this input
   * fades to nothing, `[below, above]` with `below < peak <= above`;
   * omitted is `[0, 1]`. Two in-betweens on one driver whose tents both
   * span the whole envelope fire into each other's poses, and a tongue
   * solved at three quarters was measured to re-cross at a half that had
   * been clear; naming the neighbouring peaks as the span is what makes
   * each in-between whole at its own weight and absent at its neighbours'.
   */
  between?: [number, number];
}
