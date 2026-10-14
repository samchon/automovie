import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import { digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { IAutoMovieRepaintRawOutputReceipt } from "./IAutoMovieRepaintRawOutputReceipt";
import { productionRepaintRawIsExactText } from "./productionRepaintRawIsExactText";
import { productionRepaintRawIsExactInstant } from "./productionRepaintRawIsExactInstant";
import { productionRepaintRawIsDisposition } from "./productionRepaintRawIsDisposition";

/**
 * Verify bytes against the exact attempt-owned raw receipt before resumption.
 *
 * Nonempty Uint8Array bytes, identity/text/time/disposition and a positive safe ceiling precede exact byte count, digest and canonical address comparison. Inputs remain unchanged and failures propagate. This boundary reads supplied bytes only; project readers own residency and schema admission, and no media validity is inferred. Empty bytes refuse even when the receipt supplies their exact zero count, digest and canonical path.
 *
 * @evidence contracts/common.md#principled-implementation Request/attempt equality, nonempty byte admission and receipt metadata checks precede hashing the supplied byte view and matching its exact digest-derived raw path without normalization.
 * @evidence contracts/common.md#clear-and-simple-design One assertion serves project publication and recovery readers while actual resident I/O and media probes remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stored digest cannot bypass hashing current supplied bytes, and exact empty-byte receipt metadata cannot bypass the same nonempty retention contract as planning; successful identity is not valid media or active selection.
 * @evidence contracts/common.md#meaningful-documentation Prose states unchanged inputs, ordered nonempty/metadata/byte checks, residency/schema premises and rejection of forged empty receipts.
 * @evidence contracts/performance.md#efficient-algorithms Metadata and date checks precede one O(B) byte hash, followed by canonical path comparison when the digest matches; bytes are consumed directly and no second full byte copy or media parser is created.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied current byte view is reused for count and digest rather than trusting a cached receipt verdict; shared path/hash primitives match planning.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only void or a refusal escapes; local date/hash/path temporaries expire without retaining input bytes, receipt or file descriptors.
 */
export const assertAutoMovieRepaintRawOutput: (props: {
    receipt: IAutoMovieRepaintRawOutputReceipt;
    bytes: Uint8Array;
    requestId: string;
    attemptId: string;
}) => void = (props: {
  receipt: IAutoMovieRepaintRawOutputReceipt;
  bytes: Uint8Array;
  requestId: string;
  attemptId: string;
}): void => {
  const receipt: IAutoMovieRepaintRawOutputReceipt = props.receipt;
  if (
    receipt.version !== 1 ||
    receipt.requestId !== props.requestId ||
    receipt.attemptId !== props.attemptId ||
    props.bytes instanceof Uint8Array === false ||
    props.bytes.length === 0 ||
    !productionRepaintRawIsExactText(receipt.productionId) ||
    !productionRepaintRawIsExactText(receipt.shot) ||
    !productionRepaintRawIsExactText(receipt.requestId) ||
    !productionRepaintRawIsExactText(receipt.attemptId) ||
    !productionRepaintRawIsExactText(receipt.mediaType) ||
    !productionRepaintRawIsExactText(receipt.path) ||
    !productionRepaintRawIsExactInstant(receipt.retainedAt) ||
    !productionRepaintRawIsDisposition(receipt.disposition) ||
    SHA256_DIGEST_PATTERN.test(receipt.digest) === false ||
    Number.isSafeInteger(receipt.maximumBytes) === false ||
    receipt.maximumBytes <= 0 ||
    receipt.bytes !== props.bytes.length ||
    receipt.bytes > receipt.maximumBytes ||
    receipt.digest !== digestAutoMovieBytes(props.bytes) ||
    receipt.path !==
      [
        "renditions",
        "raw",
        encodeAutoMoviePathSegment(receipt.requestId),
        encodeAutoMoviePathSegment(receipt.attemptId),
        `${receipt.digest.slice("sha256:".length)}.bin`,
      ].join("/")
  )
    throw new Error(
      "Repaint raw output does not match its immutable attempt-owned receipt.",
    );
};
