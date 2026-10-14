import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the published one-skin generation's head and body views named by a `published-generation@<head12>.<body12>` token, each with its twelve-hex digest prefix. The server checks current prefixes; a collision can accept changed bytes.
 *
 * @evidence contracts/common.md#principled-implementation The caller-classified published-generation suffix selects digest-prefix-checked head and body routes decoded through the connected asset owner.
 * @evidence contracts/common.md#clear-and-simple-design Two sequential view reads return the runtime's ordered pair without another source composition layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested digest prefixes accompany both routes and no missing view is fabricated or replaced by an isolated legacy basis.
 * @evidence contracts/common.md#meaningful-documentation The comment names the published paired token, view order, per-file digest-prefix check and collision limit.
 * @evidence contracts/performance.md#efficient-algorithms Head then body transfer/decoding is linear in their bytes and keeps the first decoded view while reading the second, without a combined serialized packet.
 * @evidence contracts/performance.md#reuse-equivalent-work Published suffixes supply the expected current digest prefixes, without complete byte-identity proof; same-worker pair promise reuse remains with the numerical-source owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives two decoded views and owns their lifetime; this adapter retains no reference/photo data or cross-call fetch cache.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedGeneration(
  token: string,
  origin: string = "",
): Promise<[IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]> {
  const [head, body]: string[] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.publishedGeneration,
    2,
  );
  return [
    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
      read: (): Promise<Response> => fetch(origin + "/basis/person/head?digest=" + head),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: (): Promise<Response> => fetch(origin + "/basis/person/body?digest=" + body),
    }),
  ];
}
