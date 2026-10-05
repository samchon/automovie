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
/**
 * The person basis token of the published one-skin generation:
 * `published-generation@<head12>.<body12>`, the leading twelve hex digits of
 * the head and body view files' SHA-256. The digests are part of the token,
 * so a changed view file names a different resident runtime, and they are
 * sent to the server, which refuses bytes that no longer match.
 */
const PUBLISHED_GENERATION = "published-generation";
const publishedGeneration = async (
  token: string,
): Promise<[IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]> => {
  const digests = digestsOf(token, PUBLISHED_GENERATION, 2);
  return [
    await readConnectedFaceAsset<IAutoMovieHumanPersonHeadView>({
      read: () => fetch("/basis/person/head?digest=" + digests[0]),
    }),
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: () => fetch("/basis/person/body?digest=" + digests[1]),
    }),
  ];
};
const face = new Map<string, Promise<ReturnType<typeof createConnectedFaceRuntime>>>();
const body = new Map<string, Promise<ReturnType<typeof createConnectedBodyRuntime>>>();
const person = new Map<string, Promise<ReturnType<typeof createConnectedPersonRuntime>>>();
/** The basis token prefix of a published basis file named by its digest. */
const PUBLISHED = "published";
/**
 * The 12-hex-digit file digests a published token names after its prefix,
 * `<prefix>@<d1>[.<d2>]`; anything else refuses by name.
 */
const digestsOf = (token: string, prefix: string, count: number): string[] => {
  const digests = token.slice(prefix.length + 1).split(".");
  if (digests.length !== count || digests.some((digest) => !/^[0-9a-f]{12}$/.test(digest)))
    throw new Error(`A ${prefix} basis token names ${count} 12-digit file digest(s): ${token}`);
  return digests;
};
/**
 * Where a basis token's file is served. `published@<d12>` is the published
 * basis of the domain, requested with its digest so the server refuses bytes
 * that changed; any other token is the candidate a hand-written document was
 * dropped beside (`<name>@<digest12>`). A person candidate is one packet at
 * `/basis/person`: a face/body basis pair or a one-skin source generation.
 */
const basisUrl = (domain: string, token: string | undefined): string => {
  if (token === undefined)
    throw new Error("A " + domain + " request needs a basis token naming its file digest.");
  return token.startsWith(PUBLISHED + "@")
    ? `/basis/${domain}?digest=${digestsOf(token, PUBLISHED, 1)[0]}`
    : `/basis/${domain}?candidate=${encodeURIComponent(token)}`;
};
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
/**
 * The legacy person pair on the separately published face and body bases,
 * `published@<face12>.<body12>`, each requested with its digest.
 */
const publishedPair = async (
  token: string,
): Promise<Pick<IAutoMovieHumanPersonGeneration, "face" | "body">> => {
  const [faceDigest, bodyDigest] = digestsOf(token, PUBLISHED, 2);
  return {
    face: await readConnectedFaceAsset<IAutoMovieHumanFaceBasis>({
      read: () => fetch("/basis/face?digest=" + faceDigest),
    }),
    body: await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
      read: () => fetch("/basis/body?digest=" + bodyDigest),
    }),
  };
};
scope.onmessage = async (event: MessageEvent<IHumanViewerNumericalRequest>) => {
  const { id, domain, basis, input } = event.data;
  const identity = domain + ":" + (basis ?? "");
  try {
    const runtime =
      domain === "person"
        ? await runtimeOf(person, identity, async () =>
            createConnectedPersonRuntime(
              basis !== undefined && basis.startsWith(PUBLISHED_GENERATION + "@")
                ? await publishedGeneration(basis)
                : basis !== undefined && basis.startsWith(PUBLISHED + "@")
                ? await publishedPair(basis)
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
