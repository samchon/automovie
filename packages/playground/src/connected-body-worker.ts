/// <reference lib="webworker" />
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import { createConnectedBodyGenerationRuntime } from "@automovie/human/human/runtime/createConnectedBodyGenerationRuntime";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";

/**
 * The body editor owns one numerical worker until transport failure or page
 * teardown. It admits the body partition view of the published person
 * generation once, then evaluates correlated
 * preview and explicit export requests against that compiled evaluator.
 * The whole-person reader consumes this same loaded body and its companion
 * head rather than fetching another body during worker preparation.
 */
import type { IConnectedBodyProgress } from "./human/body/IConnectedBodyProgress";
import type { IConnectedBodyWorkerMessage } from "./human/body/IConnectedBodyWorkerMessage";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/createHumanResidentHandler";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
const source: ReturnType<typeof readConnectedPersonSourceUrls> =
  readConnectedPersonSourceUrls(scope.name, location.href);
const signal: (progress: string) => void = (progress: string): void => {
  const message: IConnectedBodyProgress = { progress };
  scope.postMessage(message);
};
const prepared: Promise<
  (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult>
> = Promise.all([
  readConnectedHeadView(source?.head),
  readConnectedBodyView(source?.body),
]).then(
  ([head, view]: [
    IAutoMovieHumanPersonHeadView,
    IAutoMovieHumanPersonBodyView,
  ]): ((request: ConnectedBodyRequest) => Promise<ConnectedBodyResult>) =>
    createConnectedBodyGenerationRuntime(head, view, signal),
);
const handle: (
  request: IHumanResidentRequest<ConnectedBodyRequest>,
) => Promise<void> = createHumanResidentHandler({
  prepare: prepared,
  send: (reply: HumanResidentReply<ConnectedBodyResult>): void =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (event: MessageEvent<IConnectedBodyWorkerMessage>): void => {
  void handle(event.data);
};
