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
  const response = await props.read();
  ConnectedAssetEncoding.admit(response);
  const decode = props.decode ?? decodeConnectedAssetText;
  return JSON.parse(await decode(await response.arrayBuffer()));
}
