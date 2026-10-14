import { digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { AutoMovieRepaintRawOutputDisposition } from "./AutoMovieRepaintRawOutputDisposition";
import { IAutoMovieRepaintRawOutputPublication } from "./IAutoMovieRepaintRawOutputPublication";
import { productionRepaintRawExactText } from "./productionRepaintRawExactText";
import { productionRepaintRawIsDisposition } from "./productionRepaintRawIsDisposition";
import { productionRepaintRawExactInstant } from "./productionRepaintRawExactInstant";

/**
 * Plan attempt-owned raw retention by copying nonempty provider bytes within a positive safe byte ceiling, deriving their SHA-256 address and pairing the copy with an exact-UTC receipt.
 *
 * Original bytes remain unchanged and later original mutation cannot alter the copy. Returned bytes and receipt remain mutable caller-owned values that must still agree at publication. Disposition/mediaType are metadata; no media probe, candidate selection or filesystem write runs here.
 *
 * @evidence contracts/common.md#principled-implementation Exact identity/media text and disposition checks precede Uint8Array/nonempty/safe-ceiling admission, exact UTC roundtrip, detached copying and digest-derived request/attempt raw addressing.
 * @evidence contracts/common.md#clear-and-simple-design Raw recovery planning owns byte/receipt identity while provider execution, atomic publication and valid-media selection remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid/partial/cancelled/budget output uses the same retention policy without becoming delivery; empty or oversized bytes refuse instead of fabricated recovery evidence.
 * @evidence contracts/common.md#meaningful-documentation Prose gives byte-ceiling units, detached copy, mutable result ownership, exact time and no media/publication effect.
 * @evidence contracts/performance.md#efficient-algorithms Planning copies and hashes B bytes in O(B), plus fixed metadata/date/path work; caller original and B-byte output copy coexist, bounded by the supplied admitted ceiling rather than a global package limit.
 * @evidence contracts/performance.md#reuse-equivalent-work One detached byte view supplies both digest and receipt count; no provider rerun or stale digest cache is used for recovery planning.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned B-byte copy and compact receipt transfer to the caller; text/date/hash temporaries expire and no file or provider task is retained.
 */
export const planAutoMovieRepaintRawOutput: (props: {
    productionId: string;
    shot: string;
    requestId: string;
    attemptId: string;
    bytes: Uint8Array;
    mediaType: string;
    disposition: AutoMovieRepaintRawOutputDisposition;
    retainedAt: string;
    maximumBytes: number;
}) => IAutoMovieRepaintRawOutputPublication = (props: {
  productionId: string;
  shot: string;
  requestId: string;
  attemptId: string;
  bytes: Uint8Array;
  mediaType: string;
  disposition: AutoMovieRepaintRawOutputDisposition;
  retainedAt: string;
  maximumBytes: number;
}): IAutoMovieRepaintRawOutputPublication => {
  for (const [label, value] of [
    ["production id", props.productionId],
    ["shot", props.shot],
    ["request id", props.requestId],
    ["attempt id", props.attemptId],
    ["media type", props.mediaType],
  ] as const)
    productionRepaintRawExactText(value, label);
  if (!productionRepaintRawIsDisposition(props.disposition))
    throw new Error("Repaint raw output disposition is malformed.");
  if (
    props.bytes instanceof Uint8Array === false ||
    props.bytes.length === 0 ||
    Number.isSafeInteger(props.maximumBytes) === false ||
    props.maximumBytes <= 0 ||
    props.bytes.length > props.maximumBytes
  )
    throw new Error(
      "Repaint raw output requires non-empty bytes within the declared retention ceiling.",
    );
  const retainedAt: string = productionRepaintRawExactInstant(props.retainedAt);
  const bytes: Uint8Array = new Uint8Array(props.bytes);
  const digest: string = digestAutoMovieBytes(bytes);
  const path: string = [
    "renditions",
    "raw",
    encodeAutoMoviePathSegment(props.requestId),
    encodeAutoMoviePathSegment(props.attemptId),
    `${digest.slice("sha256:".length)}.bin`,
  ].join("/");
  return {
    receipt: {
      version: 1,
      productionId: props.productionId,
      shot: props.shot,
      requestId: props.requestId,
      attemptId: props.attemptId,
      path,
      digest,
      bytes: bytes.length,
      maximumBytes: props.maximumBytes,
      mediaType: props.mediaType,
      disposition: props.disposition,
      retainedAt,
    },
    bytes,
  };
};
