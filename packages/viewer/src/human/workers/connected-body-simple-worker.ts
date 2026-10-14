/// <reference lib="webworker" />
/**
 * A worker that owns the body editor's simple tier: it loads the body partition view of the published person generation once and answers expansion, projection and one measured detailed channel target. Projection reads effective shape after optional anatomy resolution; expansion and channel solving retain their actual trial-build and inverse costs. The numerical branches run in this worker rather than the page; no current host latency or interaction timing is measured here.
 *
 * Every detailed body inversion brackets within the body reach the panel shows (`connectedBodyReach`). Simple expansion instead uses the whole reader's paired endpoint support, so its stature and mass samples remain inside both views' actual domains. Stature and mass are read on the whole person (`createConnectedBodySimpleWhole`), with the head the page shows. Its whole-person reader and detailed-channel reach share the same loaded body view.
 */
import { resolveHumanBodyAnatomy } from "@automovie/human/body/anatomy/resolveHumanBodyAnatomy";
import { solveHumanBodyMeasuredChannel } from "@automovie/human/body/measure/solveHumanBodyMeasuredChannel";
import { expandHumanBodySimpleShape } from "@automovie/human/body/simple/expandHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "@automovie/human/body/simple/projectHumanBodySimpleShape";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasuredChannelSolution } from "@automovie/human/body/structures/IAutoMovieHumanBodyMeasuredChannelSolution";
import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human/body/structures/IAutoMovieHumanBodySimpleShape";
import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human/body/structures/IAutoMovieHumanBodySimpleWhole";
import { createConnectedBodySimpleWhole } from "@automovie/human/human/runtime/createConnectedBodySimpleWhole";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";

import type { IBodySimpleExpandMessage } from "@automovie/viewer/human/body/IBodySimpleExpandMessage";
import type { IBodySimpleProjectMessage } from "@automovie/viewer/human/body/IBodySimpleProjectMessage";
import type { IBodySimpleSolveMessage } from "@automovie/viewer/human/body/IBodySimpleSolveMessage";
import { readConnectedBodyView } from "@automovie/viewer/human/body/readConnectedBodyView";
import { readConnectedHeadView } from "@automovie/viewer/human/body/readConnectedHeadView";
import { connectedBodyReach } from "@automovie/human/body/measure/connectedBodyReach";
import { readConnectedPersonSourceUrls } from "@automovie/viewer/human/person/readConnectedPersonSourceUrls";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
const source: ReturnType<typeof readConnectedPersonSourceUrls> =
  readConnectedPersonSourceUrls(scope.name, location.href);
const prepared: Promise<
  readonly [IAutoMovieHumanBodyBasis, IAutoMovieHumanBodySimpleWhole]
> = Promise.all([
  readConnectedHeadView(source?.head),
  readConnectedBodyView(source?.body),
]).then(
  ([head, view]: [
    IAutoMovieHumanPersonHeadView,
    IAutoMovieHumanPersonBodyView,
  ]): readonly [IAutoMovieHumanBodyBasis, IAutoMovieHumanBodySimpleWhole] => {
    const whole: IAutoMovieHumanBodySimpleWhole =
      createConnectedBodySimpleWhole(head, view);
    // Detailed body-only measurements retain the body's own authoring reach;
    // expansion consumes the whole reader's paired reach itself; projection
    // reads a held shape and needs no inverse bracket.
    return [connectedBodyReach(view.body).basis, whole] as const;
  },
);

scope.onmessage = async (
  event: MessageEvent<
    | IBodySimpleExpandMessage
    | IBodySimpleProjectMessage
    | IBodySimpleSolveMessage
  >,
): Promise<void> => {
  const request:
    | IBodySimpleExpandMessage
    | IBodySimpleProjectMessage
    | IBodySimpleSolveMessage = event.data;
  try {
    const [basis, whole]: Awaited<typeof prepared> = await prepared;
    const result:
      | IAutoMovieHumanBodySimpleShape
      | Record<string, number>
      | IAutoMovieHumanBodyMeasuredChannelSolution =
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
