import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Read two candidate generation views selected by digest prefixes without a combined JSON string.
 *
 * The token names the host-owned input and both twelve-hex view-byte digest prefixes. The server checks each current digest prefix before those same read bytes are decoded; a collision can accept changed bytes. The unchanged Person runtime joins and admits the returned typed views, including their source partitions and geometry. Neither view is reduced or inserted into the personal numerical document; this changes transport only.
 *
 * @evidence contracts/common.md#principled-implementation Candidate prefix/stem and both digest suffixes select two server prefix-checked view routes, then the existing connected asset reader decodes each unchanged typed view.
 * @evidence contracts/common.md#clear-and-simple-design The transport returns an ordered head/body pair without joining large JSON strings or constructing a second Person runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate stems must fit the allowed filename grammar and query values are encoded; actual joined source partitions and geometry admission remain with Person.
 * @evidence contracts/common.md#meaningful-documentation Documentation assigns digest-prefix checking and its collision limit to the server, and joined anatomy admission to the unchanged runtime, with no numerical-document injection.
 * @evidence contracts/performance.md#efficient-algorithms Two assets are fetched and decoded sequentially in work proportional to their bytes, avoiding a combined JSON-string allocation and simultaneous transport decoding.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact candidate stem and digest prefixes address the requested views; promise sharing across callers belongs to the numerical-source memo rather than this fetch adapter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned pair retains its two decoded views; each fetch/asset decoder owns its transient response buffers, and this stateless adapter retains no separate model or photograph cache.
 *
 * @author Samchon
 */
export async function fetchHumanViewerCandidateGeneration(
  token: string,
  origin: string = "",
): Promise<[IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]> {
  const prefix: string = humanViewerBasisTokens.candidateGeneration + ":";
  if (!token.startsWith(prefix))
    throw new Error(
      "A split generation token needs its candidate-generation prefix.",
    );
  const name: string = token.slice(prefix.length, token.lastIndexOf("@"));
  if (!/^[A-Za-z0-9._-]+$/.test(name))
    throw new Error("A split generation token must name one input file stem.");
  const [head, body]: string[] = humanViewerBasisDigests(token, prefix + name, 2);
  return [
    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
      read: (): Promise<Response> =>
        fetch(
          origin + "/basis/person/head?candidate=" +
            encodeURIComponent(name + "@" + head),
        ),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: (): Promise<Response> =>
        fetch(
          origin + "/basis/person/body?candidate=" +
            encodeURIComponent(name + "@" + body),
        ),
    }),
  ];
}
