import type { IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredPass } from "../../AuthoredPass";
import { referenceLocation } from "../utilities/referenceLocation";

/**
 * Creates a reference to one parent story unit on a shared topology.
 *
 * Each child has one parent, each parent has one child, and neither may
 * exclude. This binds screenplay to scripts and the promoted manuscript to its
 * frozen pre-revision snapshot.
 * Use {@link createCoverageReference} for differently partitioned layers.
 *
 * `review` additionally demands a current review of the cited unit. The
 * review binds a review document to the exact unit it read: a change to that
 * unit expires the review, and the graph names the one unit to read again.
 *
 * @evidence contracts/common.md#principled-implementation UniqueEvidence, singleEvidencePerSymbol and noEvidenceExclude together form a one-to-one non-excludable relation; optional requireReview binds a reviewer to the exact cited unit version through native review semantics.
 * @evidence contracts/common.md#clear-and-simple-design The strict-lineage helper stays separate from many-to-many coverage and delegates body/revision/global address rules to referenceLocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Review is an explicit supported relation variant rather than a bypass for stale text, and no expected parent is inferred from a consumer label.
 * @evidence contracts/common.md#meaningful-documentation The prose states one-parent/one-child ownership, revision lineage and invalidation of a review when its cited unit changes.
 * @evidence contracts/performance.md#efficient-algorithms Fixed flag assembly is constant-sized; address qualification costs O(n) selector text for file hosts and retains the original selector array for H2 hosts.
 * @evidence contracts/performance.md#reuse-equivalent-work The same address builder serves lineage and coverage; references are freshly built and optional review metadata applies only to this requested relation, with no cross-analysis cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned object and any qualified selector strings belong to the caller; H2 mode can retain the supplied array, and no handle, task or module-level collection is owned.
 */
export function createLineageReference(
  files: string[],
  symbol: "file" | "h2",
  pass: AuthoredPass | "revision" = "draft",
  review: boolean = false,
): IEvidenceReference {
  return {
    type: "markdown",
    ...referenceLocation(files, pass, symbol),
    symbol,
    noEvidenceExclude: true,
    uniqueEvidence: true,
    singleEvidencePerSymbol: true,
    ...(review ? { requireReview: true } : {}),
  };
}
