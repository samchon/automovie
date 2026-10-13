/**
 * Exactly one stable, versioned behavioral explanation for a diagnostic code.
 *
 * @evidence contracts/common.md#principled-implementation A catalog revision and stable explanation id bind a diagnostic's behavioral meaning to one Markdown anchor, so a client can resolve the shipped explanation independently of occurrence-specific message text.
 * @evidence contracts/common.md#clear-and-simple-design Three reference fields preserve version, identity and display location separately, leaving diagnostic code and actual finding context on their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A message string or guessed URL cannot replace the catalog's exact explanation identity, and revision changes remain explicit instead of silently reusing an older meaning.
 * @evidence contracts/common.md#meaningful-documentation States positive catalog revision, stable explanation identity and the Markdown file-plus-anchor location rather than presenting the reference as a new diagnostic occurrence.
 * @author Samchon
 */
export interface IAutoMovieDiagnosticReference {
  /** Positive catalog revision shipped with this reference set. */
  catalogRevision: number;

  /** Stable behavioral-reference identity within the catalog revision. */
  id: string;

  /** User-facing Markdown path and stable anchor for the explanation. */
  path: string;
}
