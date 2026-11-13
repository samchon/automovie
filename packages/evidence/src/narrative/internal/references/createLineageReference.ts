import type { IEvidenceReference } from "@wrtnlabs/evidence";

import { referenceLocation } from "../utilities/referenceLocation";

/**
 * Creates a reference to one parent story unit.
 *
 * Each child host cites one parent, each parent has one child, and neither may
 * exclude. This binds each long screenplay scene file to the script scene H2
 * it realizes, and each review H2 to the authored H2 it read.
 * Use {@link createCoverageReference} for differently partitioned layers.
 *
 * `review` additionally demands a current review of the cited unit. The
 * review binds a review document to the exact unit it read: a change to that
 * unit expires the review, and the graph names the one unit to read again.
 *
 * @evidence contracts/development/implementation.md#principled-implementation UniqueEvidence, singleEvidencePerSymbol and noEvidenceExclude together form a one-to-one non-excludable relation; optional requireReview binds a reviewer to the exact cited unit version through native review semantics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The strict-lineage helper stays separate from many-to-many coverage and delegates body/global address rules to referenceLocation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Review is an explicit supported relation variant rather than a bypass for stale text, and no expected parent is inferred from a consumer label.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states one-parent/one-child ownership, its screenplay and review uses and invalidation of a review when its cited unit changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed flag assembly is constant-sized; address qualification costs O(n) selector text for file hosts and retains the original selector array for H2 hosts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same address builder serves lineage and coverage; references are freshly built and optional review metadata applies only to this requested relation, with no cross-analysis cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned object and any qualified selector strings belong to the caller; H2 mode can retain the supplied array, and no handle, task or module-level collection is owned.
 */
export function createLineageReference(
  files: string[],
  symbol: "file" | "h2",
  review: boolean = false,
): IEvidenceReference {
  return {
    type: "markdown",
    ...referenceLocation(files, symbol),
    symbol,
    noEvidenceExclude: true,
    uniqueEvidence: true,
    singleEvidencePerSymbol: true,
    ...(review ? { requireReview: true } : {}),
  };
}
