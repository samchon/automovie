import type { AutoMovieDiagnosticCode, IAutoMovieDiagnosticReference } from "@automovie/interface";

/**
 * One immutable behavioral explanation delivered for a closed diagnostic code.
 *
 * @author Samchon
 */
export interface IAutoMovieDiagnosticCatalogEntry {
  /**
   * Closed diagnostic identity resolved by this entry.
   */
  readonly code: AutoMovieDiagnosticCode;

  /**
   * Stable, versioned behavioral-reference identity and document anchor.
   */
  readonly reference: Readonly<IAutoMovieDiagnosticReference>;

  /**
   * Contract family the reported occurrence failed to satisfy.
   */
  readonly invariant: string;

  /**
   * User-owned recovery boundary; this catalog never applies it.
   */
  readonly correction: string;

  /**
   * Operation whose fresh result decides whether correction succeeded.
   */
  readonly recheck: string;
}
