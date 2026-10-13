import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanPersonBodyView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the body basis of the published one-skin generation's body view
 * named by a `published-generation-body@<body12>` token, with its digest.
 * Browser callers use relative routes; a Node observation caller supplies the
 * same resident viewer's absolute origin.
 *
 * @evidence contracts/common.md#principled-implementation Requests the published body view by its digest and projects its existing body basis; the numerical owner retains basis admission.
 * @evidence contracts/common.md#clear-and-simple-design One asset read followed by the body projection serves both relative-browser and absolute-Node origins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extracts the supplied view's body without rebuilding its torso, estimating a head or substituting a different publication.
 * @evidence contracts/common.md#meaningful-documentation States the single body digest, returned body-basis projection and origin convention for the two callers.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Requests the published body view by its digest and projects its existing body basis; the numerical owner retains basis admission.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis One asset read followed by the body projection serves both relative-browser and absolute-Node origins.
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
