/// <reference lib="webworker" />
/**
 * Resident worker of the connected person editor. It reads the published
 * person generation's head and body files once, joins them in the product
 * person runtime and answers the body editor's request protocol (preview and
 * export) for person documents.
 */
import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import { createConnectedPersonRuntime } from "./human/person/createConnectedPersonRuntime";
import type { IConnectedPersonWorkerMessage } from "./human/person/IConnectedPersonWorkerMessage";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = Promise.all([readConnectedHeadView(), readConnectedBodyView()]).then(([head, body]) => createConnectedPersonRuntime([head, body]));
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (
  event: MessageEvent<IConnectedPersonWorkerMessage>,
) => {
  void handle(event.data);
};

