/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
import { ConnectedAssetEncoding } from "./ConnectedAssetEncoding.js";

/**
 * Decode one fetched asset's bytes into its text by content: gzip bytes are
 * inflated, anything else is read as UTF-8. The transport may or may not have
 * inflated the stored gzip already, and the caller cannot tell from the URL,
 * so the magic decides. Refuses empty input, a gzip that does not inflate and
 * text that is not UTF-8, each with its reason.
 *
 * @evidence contracts/common.md#principled-implementation Rejects empty stored bytes, sniffs the two gzip magic bytes, delegates actual inflation to DecompressionStream and decodes strict UTF-8. A gzip payload inflating to empty text can still return an empty string; JSON/schema admission belongs downstream.
 * @evidence contracts/common.md#clear-and-simple-design One complete-payload decoder handles plain and gzip transport content without deciding encoding from an asset filename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native transport may already have inflated content, so actual bytes decide the path. Malformed UTF-8 and gzip reject rather than constructing a surrogate document; there is no fixture decoder fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment states content sniffing, empty stored input refusal and distinct codec errors; it does not certify a face/body schema.
 * @evidence contracts/performance.md#efficient-algorithms Plain decoding is linear in stored bytes; gzip accumulation additionally retains the entire decoded payload and text, with compressed and decoded byte populations both relevant. This is a full-asset API, not the bounded revision path.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares canonical encoding helpers with streamed revision inspection, but each stateful payload decode executes independently and has no URL/content result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns decoded text and retains no result cache. Native codec/Response accumulation settles with the call; there is no input or decompressed-byte cap, cancellation parameter or timeout.
 */
export async function decodeConnectedAssetText(
  bytes: ArrayBuffer,
): Promise<string> {
  if (bytes.byteLength === 0) throw new Error("The asset is empty.");
  const stored: Uint8Array<ArrayBuffer> = new Uint8Array(bytes);
  const plain: Uint8Array<ArrayBuffer> = ConnectedAssetEncoding.isGzip(stored)
    ? new Uint8Array(
        await ConnectedAssetEncoding.inflated(
          new Response(
            ConnectedAssetEncoding.inflate(new Blob([bytes]).stream()),
          ).arrayBuffer(),
        ),
      )
    : stored;
  return ConnectedAssetEncoding.utf8(
    new TextDecoder("utf-8", { fatal: true }),
    plain,
  );
}
