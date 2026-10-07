import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Read two exact candidate generation views without a combined JSON string.
 *
 * The token names the host-owned input and both view-byte digest prefixes.
 * Each request is verified by the server before its bytes are decoded. The
 * unchanged Person runtime joins and admits the returned typed views, including
 * their source partitions and geometry. Neither view is reduced or inserted
 * into the personal numerical document; this changes transport only.
 *
 * @evidence contracts/common.md#principled-implementation The existing typed head/body view decomposition preserves the generation while bounding each decoded JSON string to one view.
 * @evidence contracts/common.md#clear-and-simple-design Two sequential verified reads return the tuple the product runtime already joins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both actual file digests are requested and the product owner retains full schema, generation and physical admission.
 * @evidence contracts/common.md#meaningful-documentation States token ownership, individual decoding and unchanged personal input meaning.
 * @author Samchon
 */
export async function fetchHumanViewerCandidateGeneration(
  token: string,
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
          "/basis/person/head?candidate=" +
            encodeURIComponent(name + "@" + head),
        ),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: () =>
        fetch(
          "/basis/person/body?candidate=" +
            encodeURIComponent(name + "@" + body),
        ),
    }),
  ];
}
