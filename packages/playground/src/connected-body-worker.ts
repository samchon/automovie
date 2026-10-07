/// <reference lib="webworker" />
/**
 * The body editor owns one numerical worker until transport failure or page
 * teardown. It admits the body partition view of the published person
 * generation once, then evaluates correlated
 * preview and explicit export requests against that compiled evaluator.
 * The whole-person reader consumes this same loaded body and its companion
 * head rather than fetching another body during worker preparation.
 */
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyGenerationRuntime } from "./human/body/createConnectedBodyGenerationRuntime";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import type { IConnectedBodyProgress } from "./human/body/IConnectedBodyProgress";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const signal = (progress: string): void => {
  const message: IConnectedBodyProgress = { progress };
  scope.postMessage(message);
};
const prepared = Promise.all([readConnectedHeadView(), readConnectedBodyView()]).then(([head, view]) =>
  createConnectedBodyGenerationRuntime(head, view, signal),
);
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
