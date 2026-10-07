/// <reference lib="webworker" />
/**
 * The anatomy inspection page's numerical worker. It admits the body
 * partition view of the published person generation once, then answers
 * correlated preview and explicit export requests for body documents whose
 * anatomy carries exterior targets, articular head radii or source-bound
 * quantities (`createConnectedBodyAnatomyRuntime`). Whole-person readings use
 * that same loaded body view and its admitted companion head.
 */
import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./human/body/ConnectedBodyResult";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyAnatomyRuntime } from "./human/body/createConnectedBodyAnatomyRuntime";
import { createConnectedBodySimpleWhole } from "./human/body/createConnectedBodySimpleWhole";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const handle = createHumanResidentHandler<
  ConnectedBodyRequest,
  ConnectedBodyResult
>({
  prepare: Promise.all([readConnectedHeadView(), readConnectedBodyView()]).then(
    ([head, view]) =>
      createConnectedBodyAnatomyRuntime(
        view.body,
        createConnectedBodySimpleWhole(head, view),
      ),
  ),
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>) => {
  void handle(event.data);
};
