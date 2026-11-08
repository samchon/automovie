/**
 * A required loft reading failed its explicit numeric or derivative admission.
 *
 * Surface publication can refuse this reading with null while direct queries
 * still throw. Structural source/binding failures and exceptions from actual
 * callbacks use their original errors and must not be converted to this type.
 *
 * @evidence contracts/development/design.md#principled-representation A distinct Error subtype identifies an owning evaluator's pure numeric geometry/output failure or unavailable returned derivative, independently of message text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal exception type separates required-reading admission from malformed ownership and foreign callback failures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not classify arbitrary errors, choose substitute geometry or register trusted object identities.
 * @evidence contracts/development/common.md#meaningful-documentation States the direct-query throw, surface-null recovery boundary and errors that retain their original identity.
 */
export class AutoMovieLoftAdmissionError extends Error {
  /** Keep the numeric producer's diagnostic and identify the narrow recovery type. */
  public constructor(message: string) {
    super(message);
    this.name = "AutoMovieLoftAdmissionError";
  }
}
