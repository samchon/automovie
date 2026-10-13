import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";
import type { createConnectedPersonRuntime } from "@automovie/human/human/runtime/createConnectedPersonRuntime";

import { fetchHumanViewerCandidateGeneration } from "./fetchHumanViewerCandidateGeneration.js";
import { fetchHumanViewerPublishedGeneration } from "./fetchHumanViewerPublishedGeneration.js";
import { fetchHumanViewerPublishedGenerationBody } from "./fetchHumanViewerPublishedGenerationBody.js";
import { fetchHumanViewerPublishedPair } from "./fetchHumanViewerPublishedPair.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";
import { humanViewerBasisUrl } from "./humanViewerBasisUrl.js";
import { humanViewerResidentRuntime } from "./humanViewerResidentRuntime.js";

/**
 * Read actual digest-checked source assets once for document admission and
 * numerical construction in the same worker. Paired body and person routes
 * borrow the identical typed views, so anatomy context cannot come from a
 * different source than the later runtime. One latest asset per source kind
 * is retained; loading a replacement clears the prior cache entry.
 *
 * @evidence contracts/common.md#principled-implementation Existing digest-checked source readers supply both preflight and construction without a reduced anatomical context or alternate schema.
 * @evidence contracts/common.md#clear-and-simple-design Shared paired views and bounded legacy-source caches own loading; domain owners still admit documents and build geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source, document or verdict is synthesized or read from numerical model caches.
 * @evidence contracts/common.md#meaningful-documentation States shared source ownership and latest-asset retention.
 */
export function createHumanViewerNumericalSources(origin = "") {
  const tokens = humanViewerBasisTokens;
  const pairs = new Map<
    string,
    ReturnType<typeof fetchHumanViewerCandidateGeneration>
  >();
  const faces = new Map<string, Promise<IAutoMovieHumanFaceBasis>>();
  const bodies = new Map<string, Promise<IAutoMovieHumanBodyBasis>>();
  const people = new Map<
    string,
    Promise<Parameters<typeof createConnectedPersonRuntime>[0]>
  >();
  const paired = (basis: string): boolean =>
    basis.startsWith(tokens.publishedGeneration + "@") ||
    basis.startsWith(tokens.candidateGeneration + ":");
  const pair = (basis: string) =>
    humanViewerResidentRuntime(pairs, basis, () =>
      basis.startsWith(tokens.publishedGeneration + "@")
        ? fetchHumanViewerPublishedGeneration(basis, origin)
        : fetchHumanViewerCandidateGeneration(basis, origin),
    );
  return {
    face: (basis: string) =>
      humanViewerResidentRuntime(faces, basis, () =>
        readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
          read: () => fetch(origin + humanViewerBasisUrl("face", basis)),
        }),
      ),
    body: (basis: string) =>
      paired(basis)
        ? pair(basis)
        : humanViewerResidentRuntime(bodies, basis, () =>
            basis.startsWith(tokens.publishedGenerationBody + "@")
              ? fetchHumanViewerPublishedGenerationBody(basis, origin)
              : readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
                  read: () => fetch(origin + humanViewerBasisUrl("body", basis)),
                }),
          ),
    person: (basis: string) =>
      paired(basis)
        ? pair(basis)
        : humanViewerResidentRuntime(people, basis, () =>
            basis.startsWith(tokens.published + "@")
              ? fetchHumanViewerPublishedPair(basis, origin)
              : readConnectedFaceAsset<
                  Parameters<typeof createConnectedPersonRuntime>[0]
                >({ read: () => fetch(origin + humanViewerBasisUrl("person", basis)) }),
          ),
  };
}
