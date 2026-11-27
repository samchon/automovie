/**
 * Additional caller-owned fields on recovery artifacts, coverage and frontier
 * context. Values remain unknown until a reader narrows the specific field;
 * readRecoveryMetadata follows own data properties without invoking getters.
 * This open metadata bag permits producer-specific provenance and diagnostics,
 * not unchecked access to coefficient geometry or a serialization guarantee.
 */

export interface IAutoMovieRecoveryMetadata {
  /** Caller-owned plain metadata retained without inferred fields. */
  [key: string]: unknown;
}
