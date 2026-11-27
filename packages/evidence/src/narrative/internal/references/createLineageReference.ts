import type { IEvidenceReference } from "@wrtnlabs/evidence";

import { referenceLocation } from "../utilities/referenceLocation";

/*
 * Creates a reference to one parent story unit.
 *
 * Each child host cites one parent, each parent has one child, and neither may
 * exclude. This binds each long screenplay scene file to the script scene H2 it
 * realizes, and each review H2 to the authored H2 it read. Use
 * createCoverageReference for differently partitioned layers.
 *
 * `review` additionally demands a current review of the cited unit. The review
 * binds a review document to the exact unit it read: a change to that unit
 * expires the review, and the graph names the one unit to read again.
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
