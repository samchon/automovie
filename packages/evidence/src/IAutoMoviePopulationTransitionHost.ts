


/**
 * Current host supplied to transition validation.
 *
 * @evidence contracts/common.md#principled-implementation A normalized relative host path and complete source string provide the current population facts whose body and evidence identities reset validation recomputes.
 * @evidence contracts/common.md#clear-and-simple-design This read boundary separates current source bytes from the historical digests stored in a receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current source is supplied explicitly rather than replaced with a previously recorded digest.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish normalized project-relative identity from complete current source text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The current-host input shape runs no source parser or hashing pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current host data is an input snapshot and does not coordinate filesystem observation or read deduplication.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased current-host input opens no descriptor; callers supply source strings and validateAutoMoviePopulationTransition uses them for call-local identity checks without acquiring an archive.
 *
 *
 * @author Samchon
 */
export interface IAutoMoviePopulationTransitionHost {
  /** Normalized project-relative host path. */
  path: string;

  /** Complete current source. */
  source: string;
}
