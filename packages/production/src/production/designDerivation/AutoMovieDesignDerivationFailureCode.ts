/**
 * Stable derivation refusal and currentness labels used by errors and problem records.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union names the existing basis, manifest, repeatability, orphan, output and publication refusal categories.
 * @evidence contracts/common.md#clear-and-simple-design Throwing Error and nonthrowing inspection problems share these category identities while retaining different delivery paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A category alone cannot certify rollback, completed publication or recovered source authority.
 * @evidence contracts/common.md#meaningful-documentation Names all supported diagnostic categories without turning any label into an automatic retry or transaction policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union erases and selects no error classification algorithm; candidate/run/inspection owners choose their actual refusal branches.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated category text does not make separate failures equivalent or authorize replay of failed stores.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the selected string is retained through an Error/problem record; this type owns no task or diagnostic history.
 *
 * @author Samchon
 */
export type AutoMovieDesignDerivationFailureCode =
  | "design-derivation-basis-changed"
  | "design-derivation-manifest-malformed"
  | "design-derivation-nondeterministic"
  | "design-derivation-orphan-record"
  | "design-derivation-output-malformed"
  | "design-derivation-output-stale"
  | "design-derivation-publication-failed"
  | "design-derivation-stale";
