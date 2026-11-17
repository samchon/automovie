

/**
 * A well-formed RFC 5646 tag admitted by parseAutoMovieCaptionLanguage. Authored spelling remains display text while comparisonKey folds ASCII case only; the parser returns null before producing this record for malformed grammar and does not consult registry preferred values.
 *
 * @evidence contracts/development/design.md#principled-representation A well-formed RFC 5646 tag admitted by parseAutoMovieCaptionLanguage. Authored spelling remains display text while comparisonKey folds ASCII case only; the parser returns null before producing this record for malformed grammar and does not consult registry preferred values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named operation and its callers share this exact record instead of deriving a type from implementation code.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The documented boundary preserves its producer's admitted values and does not introduce a fallback representation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the concrete producer, interpretation and failure or comparison semantics.
 */
export interface IAutoMovieCaptionLanguageIdentity {
  /** Authored language tag preserved for display and serialization. */
  display: string;
  /** ASCII case-insensitive identity used by every caption consumer. */
  comparisonKey: string;
}
