import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

/**
 * Decode the caller-selected gzip JSON asset through explicit IO ports.
 * The browser entry owns fetch and decompression; this adapter owns response
 * and JSON failure propagation. The package builder owns schema, connectivity
 * and endpoint admission. No source URL from a face document is fetched here.
 *
 * The payload type is the caller's. Nothing here inspects the decoded value,
 * so naming a type is a claim the caller's downstream admission must keep.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads the application's selected reusable basis independently of any portrait or compact edit document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Delivers the explicitly selected immutable geometry payload to the numerical basis admission boundary.
 */
export async function readConnectedFaceAsset<
  Payload = IAutoMovieHumanFaceBasis,
>(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  }>;
  decode: (bytes: ArrayBuffer) => Promise<string>;
}): Promise<Payload> {
  const response = await props.read();
  if (!response.ok)
    throw new Error("Facial basis request failed: " + response.status);
  return JSON.parse(await props.decode(await response.arrayBuffer()));
}
