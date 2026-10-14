import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { productionRepaintRawExactText } from "./productionRepaintRawExactText";

/**
 * Address the immutable tracked raw receipt for an exact nonblank request/attempt pair. Shared segment encoding preserves the portable namespace; no filesystem read or publication occurs.
 *
 * @evidence contracts/common.md#principled-implementation Exact text admission precedes independently encoded request/attempt segments under renditions/raw and the fixed receipt leaf.
 * @evidence contracts/common.md#clear-and-simple-design Attempt-scoped receipt addressing remains separate from content-addressed raw bytes and project transaction state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Padded/empty IDs refuse rather than normalize, and an address alone implies no stored receipt or owned attempt.
 * @evidence contracts/common.md#meaningful-documentation Prose states request/attempt exactness, portable segment ownership and path-only result.
 * @evidence contracts/performance.md#efficient-algorithms Text trimming/encoding scan identifier lengths, with shared hashing for segments beyond the encoder's byte cutoff; joining uses fixed path components.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar address function coordinates no stored receipt request or retained path cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoding/join temporaries expire and only the path string escapes; no receipt bytes, file or task are acquired.
 */
export const productionRepaintRawOutputReceiptPath: (requestId: string, attemptId: string) => string = (
  requestId: string,
  attemptId: string,
): string =>
  [
    "renditions",
    "raw",
    encodeAutoMoviePathSegment(productionRepaintRawExactText(requestId, "request id")),
    encodeAutoMoviePathSegment(productionRepaintRawExactText(attemptId, "attempt id")),
    "receipt.json",
  ].join("/");
