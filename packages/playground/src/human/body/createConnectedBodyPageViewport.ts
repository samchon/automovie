import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { createConnectedBodyBrowserViewport } from "@automovie/viewer/human/body/createConnectedBodyBrowserViewport";

import { createHumanWorker } from "@automovie/viewer/human/common/createHumanWorker";
import { createConnectedBodyPort } from "./createConnectedBodyPort";

/**
 * Mount a body page's Viewer-owned browser viewport with the page's numerical worker role and serialization authority. `serialize` overrides the body-document encoder and `worker` overrides the default body role. The returned `close` retires its resident numerical connection and owned browser resources; the mounting page must invoke it on retirement.
 *
 * @evidence contracts/common.md#principled-implementation The page supplies canvas, document serialization and numerical-port construction while Viewer owns GPU, orbit and resize resources and their shutdown boundary.
 * @evidence contracts/common.md#clear-and-simple-design This mount adapts the page's default or overridden worker role to the body protocol without importing Three.js or repeating browser renderer setup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The real page canvas and numerical worker use the universal Viewer browser factory, without a second renderer path or synthetic body source fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment explains serializer and worker overrides, loaded source authority and the caller obligation to close the returned viewport.
 * @evidence contracts/performance.md#efficient-algorithms Page adaptation performs constant setup work; Viewer owns renderer initialization, texture loading and subsequent numerical frame costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One mounted viewport owns its resident numerical connection; no renderer or worker is shared across distinct canvas mounts solely because their documents match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquired browser resources are scoped to the Viewer factory's one close completion, and its resident port owns native-worker termination; this adapter retains only the mounted viewport and role callbacks.
 *
 * @author Samchon
 */
export function createConnectedBodyPageViewport<
  Document extends IAutoMovieHumanBodyBasisDocument =
    IAutoMovieHumanBodyBasisDocument,
>(
  canvas: HTMLCanvasElement,
  serialize?: (document: Document) => string,
  worker?: () => Worker,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): ReturnType<typeof createConnectedBodyBrowserViewport<Document>> {
  return createConnectedBodyBrowserViewport<Document>({
    source,
    canvas,
    worker: (): ReturnType<typeof createConnectedBodyPort> =>
      createConnectedBodyPort(worker?.() ?? createHumanWorker("worker=body")),
    ...(serialize === undefined ? {} : { serialize }),
  });
}
