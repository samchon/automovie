/**
 * One ordered control of a face basis: its identity, its kind, its finite
 * authoring envelope and the endpoint names applied on either side.
 *
 * @evidence contracts/common.md#principled-implementation One control's fields, extracted from the basis declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Identity, kind, envelope and two endpoint names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The envelope refuses weights outside it rather than clamping them.
 * @evidence contracts/common.md#meaningful-documentation States each field's meaning and what the envelope does not certify.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds names and dimensionless weights, no coordinate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidence contracts/modeling.md#parameter-channels A channel is named once and drives one effect.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the evaluated face is observed by its owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis declaration cites the sources of the model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of the basis bounds these values; the record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is basis data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisChannel {
  /** Anatomical or performance name unique within this basis. */
  id: string;

  /** Optional authored sign/shape meaning; it does not certify a biological range. */
  description?: string;

  /** Identity edits and transient performance remain separate in saved documents. */
  kind: "shape" | "expression";

  /**
   * Finite source-authoring envelope, including zero; weights are refused
   * rather than clamped. This bounds interpolation of authored endpoints,
   * not population anatomy. A measured parameter needs a landmark mapping
   * and population-appropriate norms before such a claim is possible.
   */
  minimum: number;
  /** Upper end of the authoring envelope; see `minimum`. */
  maximum: number;

  /** Endpoint applied with abs(weight) on the positive side. */
  positive: string;

  /** Negative-side endpoint, or null for a nonnegative control. */
  negative: string | null;
}
