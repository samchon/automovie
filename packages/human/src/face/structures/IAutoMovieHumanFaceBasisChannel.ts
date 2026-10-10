/**
 * One ordered control of a face basis: its identity, its kind, its finite
 * authoring envelope and the endpoint names applied on either side.
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
