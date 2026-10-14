/**
 * Catalog-declared identity and documentation locator for one diagnostic code.
 *
 * @evidence contracts/common.md#principled-implementation The catalog emits its revision, code-qualified reference id and configured Markdown locator independently of occurrence messages. Lookup returns these values without opening the document or verifying its anchor.
 * @evidence contracts/common.md#clear-and-simple-design Three reference fields preserve version, identity and display location separately, leaving diagnostic code and actual finding context on their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference identity does not prove the configured document or anchor exists; catalog metadata and its revision remain separate from current occurrence facts and actual documentation resolution.
 * @evidence contracts/common.md#meaningful-documentation Defines positive catalog revision, stable reference identity and the declared Markdown locator, including the current absence of document/anchor verification during lookup.
 * @author Samchon
 */
export interface IAutoMovieDiagnosticReference {
  /** Positive catalog revision shipped with this reference set. */
  catalogRevision: number;

  /** Stable behavioral-reference identity within the catalog revision. */
  id: string;

  /** Declared user-facing Markdown path and anchor; lookup does not verify their existence. */
  path: string;
}
