import path from "node:path";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { productionProjectUuid } from "./productionProjectUuid";

/**
 * Address one immutable repaint attempt record below the production state root.
 *
 * @evidence contracts/common.md#principled-implementation Admits request and attempt UUIDv4 spelling, encodes each as a segment and uses POSIX separators for the portable renditions/attempts/request/attempt.json address.
 * @evidence contracts/common.md#clear-and-simple-design Attempt publication and ledger reading share this formatter, with physical production-root resolution delegated to their tracked-file operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UUID admission retains existing case-insensitive spelling and does not establish token uniqueness or resident file existence; no attempt receives a different path rule.
 * @evidence contracts/common.md#meaningful-documentation The result is production-state relative and pairs request/attempt identities, distinct from raw media and the per-request active claim address.
 * @evidence contracts/performance.md#efficient-algorithms Checks two fixed-format UUID strings, encodes them and joins a fixed path layout; no attempt ledger or payload population is scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure path formatting has no effectful acquisition to share; enclosing attempts retain the resulting path within their own commit/read operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a path string transfers to the caller and no descriptor, claim, lock or execution task is acquired.
 */
export function productionProjectRepaintAttemptPath(requestId: string, attemptId: string): string {
    return path.posix.join("renditions", "attempts", encodeAutoMoviePathSegment(productionProjectUuid(requestId, "Repaint request id")), `${encodeAutoMoviePathSegment(productionProjectUuid(attemptId, "Repaint attempt id"))}.json`);
}
