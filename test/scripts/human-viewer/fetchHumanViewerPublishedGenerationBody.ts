import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanPersonBodyView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Fetch the body basis of the published one-skin generation's body view
 * named by a `published-generation-body@<body12>` token, with its digest.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedGenerationBody(token: string): Promise<IAutoMovieHumanBodyBasis> {
  const [body] = humanViewerBasisDigests(token, humanViewerBasisTokens.publishedGenerationBody, 1);
  const view = await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: () => fetch("/basis/person/body?digest=" + body),
  });
  return view.body;
}
