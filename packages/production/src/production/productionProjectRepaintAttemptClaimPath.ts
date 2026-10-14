import path from "node:path";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { productionProjectUuid } from "./productionProjectUuid";

/**
 * Address the stored exclusive repaint execution claim for one request.
 *
 * @evidence contracts/common.md#principled-implementation Admits and encodes the request UUIDv4 then joins the portable renditions/claims/request.json layout; claim acquisition/settlement enforce resident ownership separately.
 * @evidence contracts/common.md#clear-and-simple-design Both claim admission and settlement address the same request-local record without copying a path rule into their stateful operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Formatting does not acquire or prove an exclusive claim, admit its settlement state or assert token uniqueness; existing UUID spelling policy is retained.
 * @evidence contracts/common.md#meaningful-documentation Returns a production-state relative claim path rather than an attempt-history or raw-output address, leaving physical admission and claim policy to consumers.
 * @evidence contracts/performance.md#efficient-algorithms A fixed-format UUID check, segment encoding and fixed path join cost scalar string work without ledger scans or file reads.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One deterministic path computation has no completed acquisition/effect to share; claim owners use the result for their own guarded transaction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one path string and holds no claim record, descriptor, lock, provider request or running task.
 */
export function productionProjectRepaintAttemptClaimPath(requestId: string): string {
    return path.posix.join("renditions", "claims", `${encodeAutoMoviePathSegment(productionProjectUuid(requestId, "Repaint request id"))}.json`);
}
