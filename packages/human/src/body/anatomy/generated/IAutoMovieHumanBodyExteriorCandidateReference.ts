/**
 * Immutable source identity and evaluation frame for an exterior report.
 * This source-rest convention carries no population or clinical certificate;
 * each fulfilled measurement states its own protocol.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReference {
  /**
   * Id of the exact compiled body basis whose channels and skin the
   * instruments used; the builder refuses a reference bound to another basis.
   */
  readonly basis: string;

  /**
   * Readings are taken on the basis's authored rest frame, with no pose
   * prescribed by the request or the reference.
   */
  readonly evaluation: "source-rest";
}
