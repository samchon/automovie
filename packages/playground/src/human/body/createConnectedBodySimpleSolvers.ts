import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import { createBodySimpleWorkerTransport } from "./bodySimpleWorkerTransport";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";
import type { IConnectedBodySimpleSolvers } from "./IConnectedBodySimpleSolvers";

/**
 * The body editor's simple tier and measurement inverse, each request sent to
 * the simple-tier worker so its dozens of shape evaluations stay off the
 * page's thread.
 *
 * @author Samchon
 */
export function createConnectedBodySimpleSolvers(): IConnectedBodySimpleSolvers {
  const { ask } = createBodySimpleWorkerTransport(
    () => new Worker(new URL("../../connected-body-simple-worker.ts", import.meta.url), { type: "module" }),
  );
  return {
    expand: (simple, over) => ask<Record<string, number>>({ kind: "expand", simple, over }),
    project: (shape) => ask<IAutoMovieHumanBodySimpleShape>({ kind: "project", shape }),
    solveMeasurement: (shape, channel, targetMetres) =>
      ask<IConnectedBodyMeasurement>({ kind: "solveMeasurement", shape, channel, targetMetres }),
  };
}
