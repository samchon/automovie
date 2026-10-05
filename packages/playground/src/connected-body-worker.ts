/// <reference lib="webworker" />
/**
 * The body editor owns one numerical worker until transport failure or page
 * teardown. It admits the body partition view of the published person
 * generation once, then evaluates correlated
 * preview and explicit export requests against that compiled evaluator.
 */
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyRuntime } from "./human/body/connectedBodyRuntime";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { createHumanResidentHandler } from "./human/common/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedBodyView()
  .then((view) => view.body)
  .then(createConnectedBodyRuntime);
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>) => {
  void handle(event.data);
};
