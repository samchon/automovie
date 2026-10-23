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
