import type { AutoMovieDiagnosticCode, IAutoMovieDiagnosticReference } from "@automovie/interface";

/**
 * One immutable behavioral explanation delivered for a closed diagnostic code.
 *
 * @evidence contracts/common.md#principled-implementation Closed diagnostic identity joins one versioned behavior reference with invariant, user correction and fresh recheck instructions; explanation supplements the actual occurrence rather than executing a repair or review.
 * @evidence contracts/common.md#clear-and-simple-design The catalog producer owns stable recovery guidance while diagnostic occurrences own current target/path/facts, keeping reusable contract explanation separate from input-specific evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Guidance cannot certify that a correction ran or passed, and a reference anchor is not proof that an observed target satisfies its contract.
 * @evidence contracts/common.md#meaningful-documentation States diagnostic identity, versioned reference, failed contract family and user-owned correction/recheck authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The catalog-entry type executes no diagnostic resolution, text generation or inspection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable explanation data itself coordinates no requests; the catalog runtime owns any stored entry reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Entry scalars and the behavior reference belong to the catalog/caller, with no acquired handles or running tasks.
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
