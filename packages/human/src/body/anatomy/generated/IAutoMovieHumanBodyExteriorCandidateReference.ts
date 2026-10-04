/**
 * Immutable source identity and acquisition convention for an exterior report.
 * This source-rest convention carries no population or clinical certificate.
 *
 * @evidence contracts/common.md#clear-and-simple-design Gives the report reference one named structural owner.
 * @evidence contracts/common.md#meaningful-documentation Names the basis, evaluation frame and measurement protocol.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReference {
  /**
   * Id of the exact compiled body basis whose channel and skin witness the
   * instrument used; the builder refuses a reference bound to another basis.
   */
  readonly basis: string;

  /**
   * Readings are taken on the basis's authored rest frame, with no pose
   * prescribed by the request or the reference.
   */
  readonly evaluation: "source-rest";

  /**
   * Horizontal girth on the bare source skin through the source's own
   * nipple-level witness vertex. It is a source convention, distinct from a
   * registered standing tape acquisition, which the builder refuses as observed.
   */
  readonly protocol: "bare-source-rest-nipple-level";
}
