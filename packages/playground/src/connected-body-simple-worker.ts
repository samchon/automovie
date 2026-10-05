/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the body
 * partition view of the published person generation once and answers expansion, projection and one measured detailed
 * channel target. Each runs the package's measured inversions (dozens of full
 * shape evaluations), which would hold the page's main thread for seconds,
 * so they run here and the page stays responsive while they solve. Every
 * inversion brackets within the reach the panel shows
 * (`connectedPersonBodyReach`), so a target past an unavailable source
 * target is refused by name instead of evaluating it.
 */
import {
  expandHumanBodySimpleShape,
  projectHumanBodySimpleShape,
  solveHumanBodyMeasuredChannel,
} from "@automovie/human";

import type { IBodySimpleExpandMessage } from "./human/body/IBodySimpleExpandMessage";
import type { IBodySimpleProjectMessage } from "./human/body/IBodySimpleProjectMessage";
import type { IBodySimpleSolveMessage } from "./human/body/IBodySimpleSolveMessage";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { connectedPersonBodyReach } from "./human/person/connectedPersonBodyReach";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedBodyView().then((view) => connectedPersonBodyReach(view.body).basis);

scope.onmessage = async (
  event: MessageEvent<IBodySimpleExpandMessage | IBodySimpleProjectMessage | IBodySimpleSolveMessage>,
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
