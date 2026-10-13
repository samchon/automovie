/// <reference lib="webworker" />
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
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
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyHeadPerson } from "@automovie/human/human/runtime/createConnectedBodyHeadPerson";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/createHumanResidentHandler";
import { createConnectedPersonRuntime } from "@automovie/human/human/runtime/createConnectedPersonRuntime";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
const source: ReturnType<typeof readConnectedPersonSourceUrls> = readConnectedPersonSourceUrls(scope.name, location.href);
const prepared: Promise<(request: ConnectedBodyRequest) => Promise<ConnectedBodyResult>> = Promise.all([
  readConnectedHeadView(source?.head),
  readConnectedBodyView(source?.body),
]).then(([head, body]: [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> => {
  const evaluate: (request: ConnectedBodyRequest, progress?: (stage: string) => void) => Promise<ConnectedBodyResult> = createConnectedPersonRuntime([head, body]);
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (request.operation !== "preview")
      throw new Error("The body editor's head worker answers previews only.");
    const result: ConnectedBodyResult = await evaluate({
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
        parts: result.model.parts.filter((part: ConnectedBodyPart): boolean => part.id.startsWith("face:")),
      },
    };
  };
});
const handle: (request: IHumanResidentRequest<ConnectedBodyRequest>) => Promise<void> = createHumanResidentHandler({
  prepare: prepared,
  send: (reply: HumanResidentReply<ConnectedBodyResult>): void =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>): void => {
  void handle(event.data);
};
