/// <reference lib="webworker" />
/**
 * Numerical-only resident worker. The basis is fetched and admitted lazily once
 * per domain; it delegates every preview to the unchanged product runtime.
 * Models cross the structured-clone boundary, never reference photographs.
 */
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanPersonGeneration,
} from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime";
import { createConnectedPersonRuntime } from "@automovie/playground/src/human/person/createConnectedPersonRuntime";

import { createHumanViewerHeadlessWhole } from "./createHumanViewerHeadlessWhole";
import { fetchHumanViewerPublishedGeneration } from "./fetchHumanViewerPublishedGeneration";
import { fetchHumanViewerPublishedGenerationBody } from "./fetchHumanViewerPublishedGenerationBody";
import { fetchHumanViewerPublishedPair } from "./fetchHumanViewerPublishedPair";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";
import { humanViewerBasisUrl } from "./humanViewerBasisUrl";
import { humanViewerResidentRuntime } from "./humanViewerResidentRuntime";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles";

const scope = self as unknown as DedicatedWorkerGlobalScope;
// announce the compile generations this worker's human modules ran, so the page can refuse a mixed-compile candidate
scope.postMessage({ type: "compiles", compiles: readHumanViewerCompiles() });
const face = new Map<string, Promise<ReturnType<typeof createConnectedFaceRuntime>>>();
const body = new Map<string, Promise<ReturnType<typeof createConnectedBodyRuntime>>>();
const person = new Map<string, Promise<ReturnType<typeof createConnectedPersonRuntime>>>();
const tokens = humanViewerBasisTokens;
// identities whose resident runtime has produced at least one model; a runtime that has not is released on failure
const productive = new Set<string>();
const residents = { person, face, body } as const;
scope.onmessage = async (event: MessageEvent<IHumanViewerNumericalRequest>) => {
  const { id, domain, basis, input } = event.data;
  const identity = domain + ":" + basis;
  try {
    const runtime =
      domain === "person"
        ? await humanViewerResidentRuntime(person, identity, async () =>
            createConnectedPersonRuntime(
              basis.startsWith(tokens.publishedGeneration + "@")
                ? await fetchHumanViewerPublishedGeneration(basis)
                : basis.startsWith(tokens.published + "@")
                ? await fetchHumanViewerPublishedPair(basis)
                : await readConnectedFaceAsset<
                    | IAutoMovieHumanPersonGeneration
                    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">
                  >({ read: () => fetch(humanViewerBasisUrl("person", basis)) }),
            ),
          )
        : domain === "face"
        ? await humanViewerResidentRuntime(face, identity, () =>
            readConnectedFaceAsset({
              read: () => fetch(humanViewerBasisUrl(domain, basis)),
            }).then((asset) => createConnectedFaceRuntime({ basis: asset })),
          )
        : await humanViewerResidentRuntime(body, identity, () =>
            (basis.startsWith(tokens.publishedGenerationBody + "@")
              ? fetchHumanViewerPublishedGenerationBody(basis)
              : readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
                  read: () => fetch(humanViewerBasisUrl(domain, basis)),
                })
            ).then((asset) => createConnectedBodyRuntime(asset, createHumanViewerHeadlessWhole(asset.id))),
          );
    const start = performance.now();
    const value = await runtime({
      ...input,
      operation: "preview",
      measure: false,
    });
    productive.add(identity);
    scope.postMessage({
      id,
      success: true,
      value,
      buildMs: performance.now() - start,
    });
  } catch (error) {
    // a runtime that has never built a model cannot be reused, so its memory is released
    if (!productive.has(identity)) residents[domain].delete(identity);
    scope.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
