/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the shipped
 * body basis once and answers two requests, the expansion of simple values
 * over a detailed shape and the projection of a detailed shape back to
 * simple values. Both run the package's measured inversions (dozens of full
 * shape evaluations), which would hold the page's main thread for seconds,
 * so they run here and the page stays responsive while they solve.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  projectHumanBodySimpleShape,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-body/connected-basis/basis.json.gz",
        import.meta.url,
      ),
    ),
  decode: (bytes) =>
    new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).text(),
});

scope.onmessage = async (
  event: MessageEvent<
    | {
        id: number;
        kind: "expand";
        simple: IAutoMovieHumanBodySimpleShape;
        /** The detailed shape to keep the residue of; absent for a fresh body. */
        over?: Record<string, number>;
      }
    | { id: number; kind: "project"; shape: Record<string, number> }
  >,
) => {
  const request = event.data;
  try {
    const basis = await prepared;
    const result =
      request.kind === "expand"
        ? expandHumanBodySimpleShape(basis, request.simple, request.over)
        : projectHumanBodySimpleShape(basis, request.shape);
    scope.postMessage({ id: request.id, result });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
