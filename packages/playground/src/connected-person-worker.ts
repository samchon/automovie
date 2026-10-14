/// <reference lib="webworker" />
import type { IConnectedPersonSourceUrls } from "./human/person/IConnectedPersonSourceUrls";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IBodySimpleReply } from "./human/body/IBodySimpleReply";
/**
 * Resident worker of the connected person editor. It reads the caller-selected person generation's head and body files once, joins them in the product person runtime and answers the body editor's request protocol (preview, construction and export) for person documents, and the person editor's measurement requests on the same views.
 *
 * Requests are taken one at a time from two queues: a preview-protocol request is answered before a waiting measurement, because the measurement describes a person that the preview may be about to replace. Between requests the worker returns to its event loop, so requests that arrived meanwhile are queued before the next is chosen. It posts a stage signal when the source is joined and after each stage the runtime reports. These uncorrelated signals go to both logical endpoints; current page transports ignore them and impose no silence deadline. Result envelopes retain their own request correlation.
 */
import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { IConnectedBodyProgress } from "./human/body/IConnectedBodyProgress";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/createHumanResidentHandler";
import type { IConnectedPersonMeasureMessage } from "./human/person/IConnectedPersonMeasureMessage";
import type { IConnectedPersonWorkerMessage } from "./human/person/IConnectedPersonWorkerMessage";
import { createConnectedPersonMeasureRuntime } from "./human/person/createConnectedPersonMeasureRuntime";
import { createConnectedPersonRuntime } from "@automovie/human/human/runtime/createConnectedPersonRuntime";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
const source: IConnectedPersonSourceUrls | undefined = readConnectedPersonSourceUrls(
  scope.name || location.search,
  location.href,
);
const signal: (stage: string) => void = (stage: string): void => {
  const message: IConnectedBodyProgress = { progress: stage };
  scope.postMessage(message);
};
const head: Promise<IAutoMovieHumanPersonHeadView> = readConnectedHeadView(source?.head);
const body: Promise<IAutoMovieHumanPersonBodyView> = readConnectedBodyView(source?.body);
const prepared: Promise<(request: ConnectedBodyRequest) => Promise<ConnectedBodyResult>> = Promise.all([head, body]).then((views: [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView]): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> => {
  const runtime: (request: ConnectedBodyRequest, progress?: (stage: string) => void) => Promise<ConnectedBodyResult> = createConnectedPersonRuntime(views, { progress: signal });
  signal("source-joined");
  return (request: ConnectedBodyRequest): Promise<ConnectedBodyResult> => runtime(request, signal);
});
const handle: (request: IHumanResidentRequest<ConnectedBodyRequest>) => Promise<void> = createHumanResidentHandler({
  prepare: prepared,
  send: (reply: HumanResidentReply<ConnectedBodyResult>): void =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
const measure: (request: IConnectedPersonMeasureMessage) => Promise<IBodySimpleReply> = createConnectedPersonMeasureRuntime({ head, body, signal });
const previews: IConnectedPersonWorkerMessage[] = [];
const measurements: IConnectedPersonMeasureMessage[] = [];
let answering: boolean = false;
const answer: () => Promise<void> = async (): Promise<void> => {
  if (answering) return;
  answering = true;
  try {
    for (;;) {
      const preview: IConnectedPersonWorkerMessage | undefined = previews.shift();
      const measurement: IConnectedPersonMeasureMessage | undefined =
        preview === undefined ? measurements.shift() : undefined;
      if (preview !== undefined) await handle(preview);
      else if (measurement !== undefined)
        scope.postMessage(await measure(measurement));
      else return;
      // let requests that arrived during this one be queued before choosing
      await new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => {
        setTimeout((): void => resolve(undefined), 0);
      });
    }
  } finally {
    answering = false;
  }
};
scope.onmessage = (
  event: MessageEvent<
    IConnectedPersonWorkerMessage | IConnectedPersonMeasureMessage
  >,
): void => {
  if ("kind" in event.data) measurements.push(event.data);
  else previews.push(event.data);
  void answer();
};
