/**
 * Immutable source identity and acquisition convention for an exterior report.
 * This source-rest convention carries no population or clinical certificate.
 * @evidence contracts/common.md#clear-and-simple-design Gives the report reference one named structural owner.
 * @evidence contracts/common.md#meaningful-documentation Names the basis, evaluation frame and measurement protocol.
 */
export interface IAutoMovieHumanBodyExteriorCandidateReference {
  readonly basis: string;
  readonly evaluation: "source-rest";
  readonly protocol: "bare-source-rest-nipple-level";
}
