import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset.ts";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Fetch the published one-skin generation's head and body views named by a
 * `published-generation@<head12>.<body12>` token, each with its digest.
 *
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
