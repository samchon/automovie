/**
 * Exactly one stable, versioned behavioral explanation for a diagnostic code.
 *
 * @author Samchon
 */
export interface IAutoMovieDiagnosticReference {
  /** Positive catalog revision shipped with this reference set. */
  catalogRevision: number;

  /** Stable behavioral-reference identity within the catalog revision. */
  id: string;

  /** User-facing Markdown path and stable anchor for the explanation. */
  path: `${string}.md#${string}`;
}
