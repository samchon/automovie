import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonGeneration,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Fetch the legacy person pair on the separately published face and body
 * bases named by a `published@<face12>.<body12>` token, each with its digest.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedPair(
  token: string,
): Promise<Pick<IAutoMovieHumanPersonGeneration, "face" | "body">> {
  const [face, body] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.published,
    2,
  );
  return {
    face: await readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
      read: () => fetch("/basis/face?digest=" + face),
    }),
    body: await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
      read: () => fetch("/basis/body?digest=" + body),
    }),
  };
}
