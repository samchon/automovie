import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import { createHumanWorker } from "../common/createHumanWorker";
import { CONNECTED_BODY_WHOLE_SOURCE } from "./CONNECTED_BODY_WHOLE_SOURCE";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";
import type { IConnectedBodySimpleSolvers } from "./IConnectedBodySimpleSolvers";
import { createBodySimpleWorkerTransport } from "./bodySimpleWorkerTransport";

/**
 * The body editor's simple tier and measurement inverse, each request sent to
 * the simple-tier worker so its dozens of shape evaluations stay off the
 * page's thread. Its stature and mass are read on the whole person with the
 * standard face (`CONNECTED_BODY_WHOLE_SOURCE`).
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Expands, projects and solves the simple tier off the page's thread for the editor's identity and tape inputs.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Sends each simple-tier inversion to the dedicated worker and reads stature and mass on the whole person.
 * @author Samchon
 */
export function createConnectedBodySimpleSolvers(): IConnectedBodySimpleSolvers {
  const { ask } = createBodySimpleWorkerTransport(() =>
    createHumanWorker("worker=body-simple"),
  );
  return {
    expand: (simple, over) =>
      ask<Record<string, number>>({ kind: "expand", simple, over }),
    wholeSource: CONNECTED_BODY_WHOLE_SOURCE,
    project: (body) =>
      ask<IAutoMovieHumanBodySimpleShape>({
        kind: "project",
        shape: body.shape,
        ...(body.anatomy === undefined ? {} : { anatomy: body.anatomy }),
      }),
    solveMeasurement: (shape, channel, targetMetres) =>
      ask<IConnectedBodyMeasurement>({
        kind: "solveMeasurement",
        shape,
        channel,
        targetMetres,
      }),
  };
}
