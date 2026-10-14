/**
 * One ordered control of a face basis: its identity, its kind, its finite
 * authoring envelope and the endpoint names applied on either side.
 *
 * @evidence contracts/common.md#principled-implementation Ordered shape/expression identity, finite neutral-containing envelope and signed endpoint names define source-authored interpolation. Basis admission establishes correspondence and the weight reader refuses unknown, wrong-kind, nonfinite or out-of-envelope edits.
 * @evidence contracts/common.md#clear-and-simple-design One channel owns identity, meaning, kind and both endpoint names; persistent shape and transient expression remain distinct document records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An authoring envelope is not a population range, negative weights use their own endpoint rather than extrapolation, and admission leaves unsupported caller weights unchanged.
 * @evidence contracts/common.md#meaningful-documentation Members identify dimensionless endpoints, sign, neutral envelope and biological qualification limits; no anatomical displacement is implied by a raw weight.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration runs no weight admission or endpoint interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Channel metadata defines no cached channel state or shared geometric result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its ordered channel records; this type acquires no endpoint buffers or live resource.
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
