/// <reference lib="webworker" />
/**
 * The anatomy inspection page's numerical worker. It admits the body
 * partition view of the published person generation once, then answers
 * correlated preview and explicit export requests for body documents whose
 * anatomy carries exterior targets or articular head radii
 * (`createConnectedBodyAnatomyRuntime`).
 */
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyAnatomyRuntime } from "./human/body/createConnectedBodyAnatomyRuntime";
import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./human/body/ConnectedBodyResult";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { createHumanResidentHandler } from "./human/common/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const handle = createHumanResidentHandler<ConnectedBodyRequest, ConnectedBodyResult>({
  prepare: readConnectedBodyView().then((view) => createConnectedBodyAnatomyRuntime(view.body)),
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>) => {
  void handle(event.data);
};
