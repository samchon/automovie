/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the shipped
 * body basis once and answers expansion, projection and one measured detailed
 * channel target. Each runs the package's measured inversions (dozens of full
 * shape evaluations), which would hold the page's main thread for seconds,
 * so they run here and the page stays responsive while they solve.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  projectHumanBodySimpleShape,
  solveHumanBodyMeasuredChannel,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/common/connectedAsset";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-body/connected-basis/basis.json.gz",
        import.meta.url,
      ),
    ),
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
    | {
        id: number;
        kind: "solveMeasurement";
        shape: Record<string, number>;
        channel: string;
        targetMetres: number;
      }
  >,
) => {
  const request = event.data;
  try {
    const basis = await prepared;
    const result =
      request.kind === "expand"
        ? expandHumanBodySimpleShape(basis, request.simple, request.over)
        : request.kind === "project"
          ? projectHumanBodySimpleShape(basis, request.shape)
          : solveHumanBodyMeasuredChannel({
              basis,
              shape: request.shape,
              channel: request.channel,
              targetMetres: request.targetMetres,
            });
    scope.postMessage({ id: request.id, result });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
