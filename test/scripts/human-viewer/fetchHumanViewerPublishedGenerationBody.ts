import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanPersonBodyView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset.ts";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Fetch the body basis of the published one-skin generation's body view
 * named by a `published-generation-body@<body12>` token, with its digest.
 * Browser callers use relative routes; a Node observation caller supplies the
 * same resident viewer's absolute origin.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedGenerationBody(
  token: string,
  origin: string = "",
): Promise<IAutoMovieHumanBodyBasis> {
  const [body] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.publishedGenerationBody,
    1,
  );
  const view = await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
    read: () => fetch(origin + "/basis/person/body?digest=" + body),
  });
  return view.body;
}
