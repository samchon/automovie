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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reproduces the selected basis from its stored or transport-inflated bytes without a server-specific encoding policy.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Delivers the basis payload's exact text to admission whether or not the transport inflated the gzip.
 */
export async function decodeConnectedAssetText(
  bytes: ArrayBuffer,
): Promise<string> {
  if (bytes.byteLength === 0) throw new Error("The asset is empty.");
  const stored = new Uint8Array(bytes);
  const plain = ConnectedAssetEncoding.isGzip(stored)
    ? new Uint8Array(
        await ConnectedAssetEncoding.inflated(
          new Response(ConnectedAssetEncoding.inflate(new Blob([bytes]).stream())).arrayBuffer(),
        ),
      )
    : stored;
  return ConnectedAssetEncoding.utf8(new TextDecoder("utf-8", { fatal: true }), plain);
}
