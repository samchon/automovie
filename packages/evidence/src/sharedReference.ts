import type { AutoMovieContractFamily } from "./AutoMovieContractFamily";
import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { EXPECTED_CONTRACTS } from "./EXPECTED_CONTRACTS";
import { contractBasename } from "./contractBasename";
import { contractFamily } from "./contractFamily";

/** Resolve every graph reference through the canonical physical inventory. */
function expectedContract(family: AutoMovieContractFamily, basename: string): IAutoMovieSharedContractReference {
  return EXPECTED_CONTRACTS.find(
    (contract: IAutoMovieSharedContractReference): boolean =>
      contractFamily(contract) === family &&
      contractBasename(contract) === basename,
  )!;
}

/**
 * Creates one reference to a shared authored contract.
 *
 * Every shared family differs in two questions: whether every selected host answers every target for itself, and whether a truthful negative may exist. Keeping both flags here makes the family boundary visible at the only place that can otherwise invert it silently.
 *
 * @evidence contracts/common.md#principled-implementation Resolve a supported family and basename in the canonical inventory, then apply checklist and exclusion cardinality flags.
 * @evidence contracts/common.md#clear-and-simple-design One constructor owns shared reference policy while family-specific wrappers make their selected flags visible.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lookup assumes an existing bundled route and uses a non-null assertion; unsupported internal basename combinations are not a public admission surface.
 * @evidence contracts/common.md#meaningful-documentation root is relative or supplied by the caller, and current graph callers forward false for native review freshness.
 * @evidence contracts/performance.md#efficient-algorithms Each reference performs a linear scan of the fixed contract inventory and allocates one files array and policy record.
 * @evidence contracts/performance.md#reuse-equivalent-work The inventory objects are shared but lookup results are not cached; the supported inventory is bounded.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh reference and no registry or external resource remains live.
 */
export function sharedReference(shared: string, family: AutoMovieContractFamily, file: string, review: boolean, checklist: boolean, allowExclusion: boolean): ITtscEvidenceGraphReference {
  return ({
  type: "markdown",
  root: shared,
  files: [expectedContract(family, file).file],
  symbol: "h2",
  ...(checklist ? { checklist: true } : {}),
  ...(allowExclusion ? {} : { noEvidenceExclude: true }),
  requireReview: review,
});
}
