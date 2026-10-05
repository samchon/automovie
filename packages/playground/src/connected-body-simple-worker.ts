/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the body
 * partition view of the published person generation once and answers expansion, projection and one measured detailed
 * channel target. Each runs the package's measured inversions (dozens of full
 * shape evaluations), which would hold the page's main thread for seconds,
 * so they run here and the page stays responsive while they solve. Every
 * inversion brackets within the reach the panel shows
 * (`connectedBodyReach`), so a target past an unavailable source
 * target is refused by name instead of evaluating it. Stature and mass are
 * read on the whole person (`createConnectedBodySimpleWhole`), with the head
 * the page shows.
 */
import {
  expandHumanBodySimpleShape,
  projectHumanBodySimpleShape,
  resolveHumanBodyAnatomy,
  solveHumanBodyMeasuredChannel,
} from "@automovie/human";

import type { IBodySimpleExpandMessage } from "./human/body/IBodySimpleExpandMessage";
import type { IBodySimpleProjectMessage } from "./human/body/IBodySimpleProjectMessage";
import type { IBodySimpleSolveMessage } from "./human/body/IBodySimpleSolveMessage";
import { createConnectedBodySimpleWhole } from "./human/body/createConnectedBodySimpleWhole";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { connectedBodyReach } from "./human/common/connectedBodyReach";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = Promise.all([readConnectedBodyView().then((view) => connectedBodyReach(view.body).basis), createConnectedBodySimpleWhole()]);

scope.onmessage = async (
  event: MessageEvent<IBodySimpleExpandMessage | IBodySimpleProjectMessage | IBodySimpleSolveMessage>,
) => {
  const request = event.data;
  try {
    const [basis, whole] = await prepared;
    const result =
      request.kind === "expand"
        ? expandHumanBodySimpleShape(basis, whole, request.simple, request.over)
        : request.kind === "project"
          ? projectHumanBodySimpleShape(basis, whole, resolveHumanBodyAnatomy(basis, request.shape, request.anatomy))
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
