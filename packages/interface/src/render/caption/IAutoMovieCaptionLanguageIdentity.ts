/**
 * A well-formed RFC 5646 tag admitted by parseAutoMovieCaptionLanguage.
 * Authored spelling remains display text while comparisonKey folds ASCII case
 * only; the parser returns null before producing this record for malformed
 * grammar and does not consult registry preferred values.
 */
export interface IAutoMovieCaptionLanguageIdentity {
  /** Authored language tag preserved for display and serialization. */
  display: string;
  /** ASCII case-insensitive identity used by every caption consumer. */
  comparisonKey: string;
}
