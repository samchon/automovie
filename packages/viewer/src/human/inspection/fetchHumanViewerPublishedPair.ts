import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonGeneration,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the legacy person pair on the separately published face and body
 * bases named by a `published@<face12>.<body12>` token, each with its digest.
 *
 * @evidence contracts/common.md#principled-implementation The face and body suffixes independently select the legacy publication's digest-checked routes and shared decoding.
 * @evidence contracts/common.md#clear-and-simple-design Reassembles only the two existing face/body fields expected by the legacy person runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the separately supplied bases rather than inventing correspondence, fitting anatomy or silently choosing the one-skin generation.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the legacy paired basis token from the one-skin head/body-view publication.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedPair(
  token: string,
  origin = "",
): Promise<Pick<IAutoMovieHumanPersonGeneration, "face" | "body">> {
  const [face, body] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.published,
    2,
  );
  return {
    face: await readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
      read: () => fetch(origin + "/basis/face?digest=" + face),
    }),
    body: await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
      read: () => fetch(origin + "/basis/body?digest=" + body),
    }),
  };
}
