import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonGeneration,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the legacy person pair on the separately published face and body bases named by a `published@<face12>.<body12>` token, each with its twelve-hex digest prefix. The server checks current prefixes; a collision can accept changed bytes.
 *
 * @evidence contracts/common.md#principled-implementation Separate published face/body digest-prefix-checked routes provide the existing legacy Person basis pair through the connected asset decoder.
 * @evidence contracts/common.md#clear-and-simple-design A two-digest suffix becomes a face/body object without mixing this legacy representation with one-skin generation views.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each basis is requested under its own digest prefix, which is not full-content proof, and no absent generation view is silently replaced by legacy pair transport.
 * @evidence contracts/common.md#meaningful-documentation The comment names legacy published pair authority and distinguishes its two separately published bases.
 * @evidence contracts/performance.md#efficient-algorithms Sequential basis reads and decodes scale with each file's bytes; the returned pair only adds two object references.
 * @evidence contracts/performance.md#reuse-equivalent-work The original decoded basis objects are returned unchanged and equal-token request sharing is handled by the numerical-source promise owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned pair retains its face/body assets for the numerical caller; transient HTTP decoding belongs to the asset reader and no cross-call buffers remain here.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedPair(
  token: string,
  origin: string = "",
): Promise<Pick<IAutoMovieHumanPersonGeneration, "face" | "body">> {
  const [face, body]: string[] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.published,
    2,
  );
  return {
    face: await readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
      read: (): Promise<Response> =>
        fetch(origin + "/basis/face?digest=" + face),
    }),
    body: await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
      read: (): Promise<Response> =>
        fetch(origin + "/basis/body?digest=" + body),
    }),
  };
}
