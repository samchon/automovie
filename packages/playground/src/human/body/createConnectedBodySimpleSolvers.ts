import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import { createHumanWorker } from "../common/createHumanWorker";
import { CONNECTED_BODY_WHOLE_SOURCE } from "./CONNECTED_BODY_WHOLE_SOURCE";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";
import type { IConnectedBodySimpleSolvers } from "./IConnectedBodySimpleSolvers";
import type { IBodySimpleBody } from "./IBodySimpleBody";
import type { IBodySimpleWorkerTransport } from "./IBodySimpleWorkerTransport";
import { createBodySimpleWorkerTransport } from "./createBodySimpleWorkerTransport";

/**
 * The body editor's simple tier and measurement inverse, each request sent to the simple-tier worker so its dozens of shape evaluations stay off the page's thread. Its stature and mass are read on the whole person with the standard face (`CONNECTED_BODY_WHOLE_SOURCE`). The mounting page owns this service and must close it when retiring; close rejects unfinished asks and prevents a new worker from being allocated.
 *
 * @evidence contracts/common.md#principled-implementation The service sends the worker's three declared operation payloads and preserves anatomy on projection, keeping detailed weights canonical and whole-person measurement provenance explicit.
 * @evidence contracts/common.md#clear-and-simple-design A small typed facade maps body-editor operations to one correlated transport while numerical inverses remain in Human and document transactions remain in the panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The worker evaluates actual inputs without fixture measurements or a main-thread fallback, and the whole-person source label does not claim clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies off-thread numerical ownership, standard-face measurement context, page-owned service lifetime and permanent-close effects.
 * @evidence contracts/performance.md#efficient-algorithms Each facade call assembles one constant-size envelope plus references to its supplied shape or anatomy; worker message cloning and numerical evaluation dominate with payload and basis size.
 * @evidence contracts/performance.md#reuse-equivalent-work All operations reuse the service's healthy resident worker and loaded reader; the transport replaces failed connections and does not merge distinct authored requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One transport is retained per service, with one worker and an uncapped outstanding-caller queue; replies and failures release requests, and page-owned close rejects pending asks and terminates the worker permanently.
 *
 * @author Samchon
 */
export function createConnectedBodySimpleSolvers(): IConnectedBodySimpleSolvers {
  const transport: IBodySimpleWorkerTransport = createBodySimpleWorkerTransport((): Worker =>
    createHumanWorker("worker=body-simple"),
  );
  return {
    expand: (simple: IAutoMovieHumanBodySimpleShape, over: Record<string, number>): Promise<Record<string, number>> =>
      transport.ask<Record<string, number>>({ kind: "expand", simple, over }),
    wholeSource: CONNECTED_BODY_WHOLE_SOURCE,
    project: (body: IBodySimpleBody): Promise<IAutoMovieHumanBodySimpleShape> =>
      transport.ask<IAutoMovieHumanBodySimpleShape>({
        kind: "project",
        shape: body.shape,
        ...(body.anatomy === undefined ? {} : { anatomy: body.anatomy }),
      }),
    solveMeasurement: (shape: Record<string, number>, channel: string, targetMetres: number): Promise<IConnectedBodyMeasurement> =>
      transport.ask<IConnectedBodyMeasurement>({
        kind: "solveMeasurement",
        shape,
        channel,
        targetMetres,
      }),
    close: (): void => transport.close(),
  };
}
