/// <reference lib="webworker" />
/**
 * Resident worker of the connected person editor. It reads the published
 * person generation's head and body files once, joins them in the product
 * person runtime and answers the body editor's request protocol (preview,
 * construction and export) for person documents, and the person editor's
 * measurement requests on the same views.
 *
 * Every evaluation is one synchronous stage, so requests are taken one at a
 * time from two queues: a preview-protocol request is answered before a
 * waiting measurement, because the measurement describes a person that the
 * preview may be about to replace. Between requests the worker returns to its
 * event loop, so requests that arrived meanwhile are queued before the next
 * is chosen. It posts a stage signal when the source is
 * joined and after each stage the runtime reports, so the page transport
 * measures silence and not the length of a whole request.
 */
import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import type { IConnectedBodyProgress } from "./human/body/IConnectedBodyProgress";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import { createConnectedPersonRuntime } from "./human/person/createConnectedPersonRuntime";
import type { IConnectedPersonWorkerMessage } from "./human/person/IConnectedPersonWorkerMessage";
import { createConnectedPersonMeasureRuntime } from "./human/person/createConnectedPersonMeasureRuntime";
import type { IConnectedPersonMeasureMessage } from "./human/person/IConnectedPersonMeasureMessage";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const source = readConnectedPersonSourceUrls(scope.name || location.search, location.href);
const signal = (stage: string): void => {
  const message: IConnectedBodyProgress = { progress: stage };
  scope.postMessage(message);
};
const head = readConnectedHeadView(source?.head);
const body = readConnectedBodyView(source?.body);
const prepared = Promise.all([head, body]).then((views) => {
  const runtime = createConnectedPersonRuntime(views, { progress: signal });
  signal("source-joined");
  return (request: ConnectedBodyRequest) => runtime(request, signal);
});
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
const measure = createConnectedPersonMeasureRuntime({ head, body, signal });
const previews: IConnectedPersonWorkerMessage[] = [];
const measurements: IConnectedPersonMeasureMessage[] = [];
let answering = false;
const answer = async (): Promise<void> => {
  if (answering) return;
  answering = true;
  try {
    for (;;) {
      const preview = previews.shift();
      const measurement = preview === undefined ? measurements.shift() : undefined;
      if (preview !== undefined) await handle(preview);
      else if (measurement !== undefined) scope.postMessage(await measure(measurement));
      else return;
      // let requests that arrived during this one be queued before choosing
      await new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), 0);
      });
    }
  } finally {
    answering = false;
  }
};
scope.onmessage = (
  event: MessageEvent<IConnectedPersonWorkerMessage | IConnectedPersonMeasureMessage>,
) => {
  if ("kind" in event.data) measurements.push(event.data);
  else previews.push(event.data);
  void answer();
};
