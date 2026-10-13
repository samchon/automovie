import type { AutoMovieContractDomain } from "./AutoMovieContractDomain";

/**
 * Domain, physical docs-relative file and ordered H2 anchors pin one supported bundled contract route.
 *
 * @evidence contracts/common.md#principled-implementation Domain, physical docs-relative file and ordered H2 anchors pin one supported bundled contract route.
 * @evidence contracts/common.md#clear-and-simple-design The inventory object is shared by admission, reference lookup and logical manifest paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pinned routes constrain inventory identity rather than arbitrary contract prose bytes.
 * @evidence contracts/common.md#meaningful-documentation anchors preserve native target order and file includes the family and domain directories.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; EXPECTED_CONTRACTS retains bounded route records used by validateContracts and sharedReference, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; EXPECTED_CONTRACTS retains bounded route records used by validateContracts and sharedReference, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; EXPECTED_CONTRACTS retains bounded route records used by validateContracts and sharedReference, while the caller or module owns the lifetime of its values.
 */
export type IAutoMovieSharedContractReference = {
  /** Semantic route domain, separate from the directory's duty family. */
  domain: AutoMovieContractDomain;

  /** Physical contract path relative to generated docs. */
  file: string;

  /** Expected H2 target addresses in canonical source order. */
  anchors: readonly string[];
};
