import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
} from "@automovie/human";
import type { createConnectedPersonRuntime } from "@automovie/human/human/runtime/createConnectedPersonRuntime";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { fetchHumanViewerCandidateGeneration } from "./fetchHumanViewerCandidateGeneration.js";
import { fetchHumanViewerPublishedGeneration } from "./fetchHumanViewerPublishedGeneration.js";
import { fetchHumanViewerPublishedGenerationBody } from "./fetchHumanViewerPublishedGenerationBody.js";
import { fetchHumanViewerPublishedPair } from "./fetchHumanViewerPublishedPair.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";
import { humanViewerBasisUrl } from "./humanViewerBasisUrl.js";
import { humanViewerResidentRuntime } from "./humanViewerResidentRuntime.js";

/**
 * Read actual source assets through digest-prefix-checked routes for document admission and numerical construction in the same worker. Prefix collisions can accept changed bytes; this transport is not full-content identity proof. Paired body and person routes borrow the identical typed views, so their context and later runtime share the same fetched objects. One latest asset per source kind is retained; loading a replacement clears the prior cache entry.
 *
 * @evidence contracts/common.md#principled-implementation Domain basis tokens select existing digest-prefix-checked asset routes, and paired body/person requests share the actual candidate or published generation promise; prefix equality does not prove complete byte identity.
 * @evidence contracts/common.md#clear-and-simple-design Four latest-key promise maps separate face, body, person and paired generation sources without constructing anatomy in this adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paired contexts borrow the same generation views as numerical construction and ordinary asset routes still use the product asset reader rather than a synthetic basis fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment defines same-worker admission/construction sharing and one-latest-asset retention per source kind.
 * @evidence contracts/performance.md#efficient-algorithms Token selection and map lookup add constant bookkeeping; actual transport, digest verification and asset decoding remain with their source owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact basis strings share one promise within this fixed origin and worker; replacement clears that source-kind map and a failed promise is removed by the resident-runtime memo owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each of four maps retains at most one current promise, but callers can retain replaced in-flight requests until settlement; fetched typed views live with this numerical worker realm and no separate physical-resource disposer is claimed.
 */
export function createHumanViewerNumericalSources(origin: string = ""): {
  face: (basis: string) => Promise<IAutoMovieHumanFaceBasis>;
  body: (
    basis: string,
  ) =>
    | ReturnType<typeof fetchHumanViewerCandidateGeneration>
    | Promise<IAutoMovieHumanBodyBasis>;
  person: (
    basis: string,
  ) =>
    | ReturnType<typeof fetchHumanViewerCandidateGeneration>
    | Promise<Parameters<typeof createConnectedPersonRuntime>[0]>;
} {
  const tokens: typeof humanViewerBasisTokens = humanViewerBasisTokens;
  const pairs: Map<
    string,
    ReturnType<typeof fetchHumanViewerCandidateGeneration>
  > = new Map();
  const faces: Map<string, Promise<IAutoMovieHumanFaceBasis>> = new Map();
  const bodies: Map<string, Promise<IAutoMovieHumanBodyBasis>> = new Map();
  const people: Map<
    string,
    Promise<Parameters<typeof createConnectedPersonRuntime>[0]>
  > = new Map();
  const paired: (basis: string) => boolean = (basis: string): boolean =>
    basis.startsWith(tokens.publishedGeneration + "@") ||
    basis.startsWith(tokens.candidateGeneration + ":");
  const pair: (
    basis: string,
  ) => ReturnType<typeof fetchHumanViewerCandidateGeneration> = (
    basis: string,
  ): ReturnType<typeof fetchHumanViewerCandidateGeneration> =>
    humanViewerResidentRuntime(
      pairs,
      basis,
      (): ReturnType<typeof fetchHumanViewerCandidateGeneration> =>
        basis.startsWith(tokens.publishedGeneration + "@")
          ? fetchHumanViewerPublishedGeneration(basis, origin)
          : fetchHumanViewerCandidateGeneration(basis, origin),
    );
  return {
    face: (basis: string): Promise<IAutoMovieHumanFaceBasis> =>
      humanViewerResidentRuntime(
        faces,
        basis,
        (): Promise<IAutoMovieHumanFaceBasis> =>
          readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
            read: (): Promise<Response> =>
              fetch(origin + humanViewerBasisUrl("face", basis)),
          }),
      ),
    body: (
      basis: string,
    ):
      | ReturnType<typeof fetchHumanViewerCandidateGeneration>
      | Promise<IAutoMovieHumanBodyBasis> =>
      paired(basis)
        ? pair(basis)
        : humanViewerResidentRuntime(
            bodies,
            basis,
            (): Promise<IAutoMovieHumanBodyBasis> =>
              basis.startsWith(tokens.publishedGenerationBody + "@")
                ? fetchHumanViewerPublishedGenerationBody(basis, origin)
                : readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
                    read: (): Promise<Response> =>
                      fetch(origin + humanViewerBasisUrl("body", basis)),
                  }),
          ),
    person: (
      basis: string,
    ):
      | ReturnType<typeof fetchHumanViewerCandidateGeneration>
      | Promise<Parameters<typeof createConnectedPersonRuntime>[0]> =>
      paired(basis)
        ? pair(basis)
        : humanViewerResidentRuntime(
            people,
            basis,
            (): Promise<Parameters<typeof createConnectedPersonRuntime>[0]> =>
              basis.startsWith(tokens.published + "@")
                ? fetchHumanViewerPublishedPair(basis, origin)
                : readConnectedFaceAsset<
                    Parameters<typeof createConnectedPersonRuntime>[0]
                  >({
                    read: (): Promise<Response> =>
                      fetch(origin + humanViewerBasisUrl("person", basis)),
                  }),
          ),
  };
}
