/**
 * A required loft reading failed its explicit numeric or derivative admission.
 *
 * Surface publication can refuse this reading with null while direct queries
 * still throw. Structural source/binding failures and exceptions from actual
 * callbacks use their original errors and must not be converted to this type.
 *
 * @evidence contracts/common.md#principled-implementation A distinct Error subtype identifies an owning evaluator's pure numeric geometry/output failure or unavailable returned derivative, independently of message text.
 * @evidence contracts/common.md#clear-and-simple-design One internal exception type separates required-reading admission from malformed ownership and foreign callback failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not classify arbitrary errors, choose substitute geometry or register trusted object identities.
 * @evidence contracts/common.md#meaningful-documentation States the direct-query throw, surface-null recovery boundary and errors that retain their original identity.
 * @evidence contracts/performance.md#efficient-algorithms Construction has the built-in Error message/stack cost; no chain or geometry is scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An exception value coordinates no reusable geometric work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The throwing/catching call owns its message and stack until release; this type retains no source, cache or handle.
 */
export class AutoMovieLoftAdmissionError extends Error {
  /** Keep the numeric producer's diagnostic and identify the narrow recovery type. */
  public constructor(message: string) {
    super(message);
    this.name = "AutoMovieLoftAdmissionError";
  }
}
