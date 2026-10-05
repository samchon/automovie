/// <reference lib="webworker" />
/**
 * Numerical-only resident worker. The basis is fetched and admitted lazily once
 * per domain; it delegates every preview to the unchanged product runtime.
 * Models cross the structured-clone boundary, never reference photographs.
 */
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonGeneration,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime";
import { createConnectedPersonRuntime } from "@automovie/playground/src/human/person/createConnectedPersonRuntime";

import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";

const scope = self as unknown as DedicatedWorkerGlobalScope;
/** The person basis token for the published one-skin generation's head and body files. */
const PUBLISHED_GENERATION = "published-generation";
const face = new Map<string, Promise<ReturnType<typeof createConnectedFaceRuntime>>>();
const body = new Map<string, Promise<ReturnType<typeof createConnectedBodyRuntime>>>();
const person = new Map<string, Promise<ReturnType<typeof createConnectedPersonRuntime>>>();
/**
 * The published basis, or the candidate a hand-written document was dropped
 * beside. A person candidate is one packet at `/basis/person`: a face/body
 * basis pair or a one-skin source generation. The person basis
 * `published-generation` reads the published head and body files at
 * `/basis/person/head` and `/basis/person/body`.
 */
const basisUrl = (domain: string, candidate: string | undefined): string =>
  `/basis/${domain}` +
  (candidate === undefined ? "" : `?candidate=${encodeURIComponent(candidate)}`);
/**
 * One resident runtime per domain: a candidate basis replaces the last one
 * instead of accumulating tens of megabytes per candidate.
 */
const runtimeOf = <T,>(
  cache: Map<string, Promise<T>>,
  identity: string,
  create: () => Promise<T>,
): Promise<T> => {
  let found = cache.get(identity);
  if (found === undefined) {
    cache.clear();
    found = create();
    cache.set(identity, found);
  }
  return found;
};
scope.onmessage = async (event: MessageEvent<IHumanViewerNumericalRequest>) => {
  const { id, domain, basis, input } = event.data;
  const identity = domain + ":" + (basis ?? "");
  try {
    const runtime =
      domain === "person"
        ? await runtimeOf(person, identity, async () =>
            createConnectedPersonRuntime(
              basis === PUBLISHED_GENERATION
                ? [
                    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
                      read: () => fetch("/basis/person/head"),
                    }),
                    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
                      read: () => fetch("/basis/person/body"),
                    }),
                  ]
                : basis === undefined
                ? {
                    face: await readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
                      read: () => fetch(basisUrl("face", undefined)),
                    }),
                    body: await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
                      read: () => fetch(basisUrl("body", undefined)),
                    }),
                  }
                : await readConnectedFaceAsset<
                    | IAutoMovieHumanPersonGeneration
                    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">
                  >({ read: () => fetch(basisUrl("person", basis)) }),
            ),
          )
        : domain === "face"
        ? await runtimeOf(face, identity, () =>
            readConnectedFaceAsset({
              read: () => fetch(basisUrl(domain, basis)),
            }).then((asset) => createConnectedFaceRuntime({ basis: asset })),
          )
        : await runtimeOf(body, identity, () =>
            readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
              read: () => fetch(basisUrl(domain, basis)),
            }).then(createConnectedBodyRuntime),
          );
    const start = performance.now();
    const value = await runtime({
      ...input,
      operation: "preview",
      measure: false,
    });
    scope.postMessage({
      id,
      success: true,
      value,
      buildMs: performance.now() - start,
    });
  } catch (error) {
    scope.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
