/// <reference lib="webworker" />
/**
 * Resident worker of the body editor's head. The body editor edits the body
 * partition view of the published person generation; its head is that
 * generation's head view evaluated with the default face, so the neck meets
 * the head the way the person evaluator carries it. This worker reads the
 * generation's two files once, wraps each body document the page sends in a
 * person with the head view's default face (`createConnectedBodyHeadPerson`),
 * evaluates it with the product person runtime and returns only the head
 * (`face:`) parts.
 */
import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./human/body/ConnectedBodyResult";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyHeadPerson } from "./human/body/createConnectedBodyHeadPerson";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import { createConnectedPersonRuntime } from "./human/person/createConnectedPersonRuntime";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = Promise.all([
  readConnectedHeadView(),
  readConnectedBodyView(),
]).then(([head, body]) => {
  const evaluate = createConnectedPersonRuntime([head, body]);
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (request.operation !== "preview")
      throw new Error("The body editor's head worker answers previews only.");
    const result = await evaluate({
      ...request,
      document: createConnectedBodyHeadPerson(
        head,
        request.document,
        body.body.anatomicalAssembly,
      ),
    });
    if (result.operation !== "preview")
      throw new Error("Expected a person preview.");
    return {
      ...result,
      model: {
        ...result.model,
        parts: result.model.parts.filter((part) => part.id.startsWith("face:")),
      },
    };
  };
});
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
