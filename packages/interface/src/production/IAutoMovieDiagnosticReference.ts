/**
 * Exactly one stable, versioned behavioral explanation for a diagnostic code.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Makes every emitted code resolve to one versioned user-facing reference.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Separates stable catalog identity from the concrete anchored knowledge path.
 * @author Samchon
 */
export interface IAutoMovieDiagnosticReference {
  /**
   * Positive catalog revision shipped with this reference set.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Detects stale code-to-reference joins across catalog revisions.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Carries the catalog revision used by actual delivery.
   */
  catalogRevision: number;

  /**
   * Stable behavioral-reference identity within the catalog revision.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Gives a diagnostic exactly one reference identity.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Keys the exhaustive catalog entry independently of prose location.
   */
  id: string;

  /**
   * User-facing Markdown path and stable anchor for the explanation.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Makes the behavioral reference resolvable by the user's knowledge surface.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Links the code to cause, affected parameter, impact, and correction guidance.
   */
  path: `${string}.md#${string}`;
}
