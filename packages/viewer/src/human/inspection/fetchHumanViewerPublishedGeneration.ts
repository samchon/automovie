import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the published one-skin generation's head and body views named by a
 * `published-generation@<head12>.<body12>` token, each with its digest.
 *
 * @evidence contracts/common.md#principled-implementation The head and body digest suffixes select their respective server publication routes; decoding remains with the shared asset reader.
 * @evidence contracts/common.md#clear-and-simple-design Returns the existing head/body tuple in publication order without copying its schema or numerical generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requests the actual digest-addressed views and returns their decoded payloads without synthesized geometry or an alternate preview source.
 * @evidence contracts/common.md#meaningful-documentation Names both token components, their tuple order and the publication source instead of claiming anatomical admission.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis The head and body digest suffixes select their respective server publication routes; decoding remains with the shared asset reader.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Returns the existing head/body tuple in publication order without copying its schema or numerical generation.
 * @author Samchon
 */
export async function fetchHumanViewerPublishedGeneration(
  token: string,
  origin = "",
): Promise<[IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]> {
  const [head, body] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.publishedGeneration,
    2,
  );
  return [
    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
      read: () => fetch(origin + "/basis/person/head?digest=" + head),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: () => fetch(origin + "/basis/person/body?digest=" + body),
    }),
  ];
}
