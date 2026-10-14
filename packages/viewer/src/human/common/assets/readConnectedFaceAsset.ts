/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
import { ConnectedAssetEncoding } from "./ConnectedAssetEncoding.js";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { decodeConnectedAssetText } from "./decodeConnectedAssetText.js";


/**
 * Decode the caller-selected gzip JSON asset through explicit IO ports.
 * The browser entry owns fetch; this adapter owns response and JSON failure
 * propagation and decodes by content unless the caller supplies its own
 * decoder. The package builder owns schema, connectivity and endpoint
 * admission. No source URL from a face document is fetched here.
 *
 * The payload type is the caller's. Nothing here inspects the decoded value,
 * so naming a type is a claim the caller's downstream admission must keep.
 *
 * @evidence contracts/common.md#principled-implementation Calls the explicit response port, checks transport success, reads its bytes, applies the selected decoder and parses JSON into the caller-claimed Payload. Generic typing does not validate schema, connectivity or endpoint values; the numerical builder admits those afterward.
 * @evidence contracts/common.md#clear-and-simple-design Fetch ownership stays with browser/worker consumers while this adapter owns status/decode/JSON sequencing. Its historical face name also serves admitted person/body views through the explicit generic payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document source URL is fetched, no fixture payload is substituted, and a custom decoder is an explicit caller choice rather than a silent recovery path.
 * @evidence contracts/common.md#meaningful-documentation The comment states IO ownership, content decoding, parser failures and the generic payload's unvalidated nature; decode omission has a documented default.
 * @evidence contracts/performance.md#efficient-algorithms Accumulates all stored and decoded bytes/text and parses the full JSON tree, linear work/storage in those populations with no payload cap. Upstream numerical construction is separate additional cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the complete content decoder while every actual read remains effectful; no asset URL or claimed Payload type serves as a cache equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed data transfers to the caller and response/temporary byte/text references end after settlement. No cancellation or timeout is exposed, so an in-flight read may retain its buffers indefinitely until the supplied port settles.
 */
export async function readConnectedFaceAsset<
  Payload = IAutoMovieHumanFaceBasis,
>(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  }>;
  /** Bytes to text; by content when omitted. */
  decode?: (bytes: ArrayBuffer) => Promise<string>;
}): Promise<Payload> {
  const response: { ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer>; } = await props.read();
  ConnectedAssetEncoding.admit(response);
  const decode: (bytes: ArrayBuffer) => Promise<string> = props.decode ?? decodeConnectedAssetText;
  return JSON.parse(await decode(await response.arrayBuffer()));
}
