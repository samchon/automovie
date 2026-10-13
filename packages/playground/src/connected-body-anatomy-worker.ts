/// <reference lib="webworker" />
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
/**
 * The anatomy inspection page's numerical worker. It admits the body
 * partition view of the published person generation once, then answers
 * correlated preview and explicit export requests for body documents whose
 * anatomy carries exterior targets, articular head radii or source-bound
 * quantities (`createConnectedBodyAnatomyRuntime`). Whole-person readings use
 * that same loaded body view and its admitted companion head.
 */
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyAnatomyRuntime } from "@automovie/human/body/runtime/createConnectedBodyAnatomyRuntime";
import { createConnectedBodySimpleWhole } from "@automovie/human/human/runtime/createConnectedBodySimpleWhole";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/createHumanResidentHandler";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
const source: ReturnType<typeof readConnectedPersonSourceUrls> = readConnectedPersonSourceUrls(scope.name, location.href);
const handle: (request: IHumanResidentRequest<ConnectedBodyRequest>) => Promise<void> = createHumanResidentHandler<
  ConnectedBodyRequest,
  ConnectedBodyResult
>({
  prepare: Promise.all([readConnectedHeadView(source?.head), readConnectedBodyView(source?.body)]).then(
    ([head, view]: [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> =>
      createConnectedBodyAnatomyRuntime(
        view.body,
        createConnectedBodySimpleWhole(head, view),
      ),
  ),
  send: (reply: HumanResidentReply<ConnectedBodyResult>): void =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>): void => {
  void handle(event.data);
};
