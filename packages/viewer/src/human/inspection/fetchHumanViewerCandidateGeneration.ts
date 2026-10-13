import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Read two exact candidate generation views without a combined JSON string.
 *
 * The token names the host-owned input and both view-byte digest prefixes.
 * Each request is verified by the server before its bytes are decoded. The
 * unchanged Person runtime joins and admits the returned typed views, including
 * their source partitions and geometry. Neither view is reduced or inserted
 * into the personal numerical document; this changes transport only.
 *
 * @author Samchon
 */
export async function fetchHumanViewerCandidateGeneration(
  token: string,
  origin = "",
): Promise<[IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]> {
  const prefix = humanViewerBasisTokens.candidateGeneration + ":";
  if (!token.startsWith(prefix))
    throw new Error(
      "A split generation token needs its candidate-generation prefix.",
    );
  const name = token.slice(prefix.length, token.lastIndexOf("@"));
  if (!/^[A-Za-z0-9._-]+$/.test(name))
    throw new Error("A split generation token must name one input file stem.");
  const [head, body] = humanViewerBasisDigests(token, prefix + name, 2);
  return [
    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
      read: () =>
        fetch(
          origin + "/basis/person/head?candidate=" +
            encodeURIComponent(name + "@" + head),
        ),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: () =>
        fetch(
          origin + "/basis/person/body?candidate=" +
            encodeURIComponent(name + "@" + body),
        ),
    }),
  ];
}
