/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the body
 * partition view of the published person generation once and answers expansion, projection and one measured detailed
 * channel target. Each runs the package's measured inversions (dozens of full
 * shape evaluations), which would hold the page's main thread for seconds,
 * so they run here and the page stays responsive while they solve. Every
 * detailed body inversion brackets within the body reach the panel shows
 * (`connectedBodyReach`). Simple expansion instead uses the whole reader's
 * paired endpoint support, so its stature and mass samples remain inside
 * both views' actual domains. Stature and mass are
 * read on the whole person (`createConnectedBodySimpleWhole`), with the head
 * the page shows. Its whole-person reader and detailed-channel reach share
 * the same loaded body view.
 */
import { resolveHumanBodyAnatomy } from "@automovie/human/body/anatomy/resolveHumanBodyAnatomy";
import { solveHumanBodyMeasuredChannel } from "@automovie/human/body/measure/solveHumanBodyMeasuredChannel";
import { expandHumanBodySimpleShape } from "@automovie/human/body/simple/expandHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "@automovie/human/body/simple/projectHumanBodySimpleShape";
import { createConnectedBodySimpleWhole } from "@automovie/human/human/runtime/createConnectedBodySimpleWhole";

import type { IBodySimpleExpandMessage } from "./human/body/IBodySimpleExpandMessage";
import type { IBodySimpleProjectMessage } from "./human/body/IBodySimpleProjectMessage";
import type { IBodySimpleSolveMessage } from "./human/body/IBodySimpleSolveMessage";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { connectedBodyReach } from "./human/common/connectedBodyReach";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = Promise.all([
  readConnectedHeadView(),
  readConnectedBodyView(),
]).then(([head, view]) => {
  const whole = createConnectedBodySimpleWhole(head, view);
  // Detailed body-only measurements retain the body's own authoring reach;
  // expansion consumes the whole reader's paired reach itself; projection
  // reads a held shape and needs no inverse bracket.
  return [connectedBodyReach(view.body).basis, whole] as const;
});

scope.onmessage = async (
  event: MessageEvent<
    | IBodySimpleExpandMessage
    | IBodySimpleProjectMessage
    | IBodySimpleSolveMessage
  >,
) => {
  const request = event.data;
  try {
    const [basis, whole] = await prepared;
    const result =
      request.kind === "expand"
        ? expandHumanBodySimpleShape(basis, whole, request.simple, request.over)
        : request.kind === "project"
          ? projectHumanBodySimpleShape(
              basis,
              whole,
              resolveHumanBodyAnatomy(basis, request.shape, request.anatomy),
            )
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
