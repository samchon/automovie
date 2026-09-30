/// <reference lib="webworker" />
/**
 * Numerical-only resident worker. The basis is fetched and admitted lazily once
 * per domain; it delegates every preview to the unchanged product runtime.
 * Models cross the structured-clone boundary, never reference photographs.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { readConnectedFaceAsset } from "@automovie/playground/src/human/common/connectedAsset";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime";

const scope = self as unknown as DedicatedWorkerGlobalScope;
let face: Promise<ReturnType<typeof createConnectedFaceRuntime>> | undefined;
let body: Promise<ReturnType<typeof createConnectedBodyRuntime>> | undefined;
scope.onmessage = async (
  event: MessageEvent<{
    id: number;
    domain: "face" | "body";
    input: { document: string; occlusion?: boolean };
  }>,
) => {
  const { id, domain, input } = event.data;
  try {
    const runtime =
      domain === "face"
        ? await (face ??= readConnectedFaceAsset({
            read: () => fetch("/basis/face"),
          }).then((basis) => createConnectedFaceRuntime({ basis })))
        : await (body ??= readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
            read: () => fetch("/basis/body"),
          }).then(createConnectedBodyRuntime));
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
