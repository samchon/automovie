/**
 * Native transport for correlated body preview and export calls. A browser
 * Worker reports explicit errors and unreadable messages. Requests remain
 * serial until their actual reply; elapsed time never retires a healthy
 * numerical evaluation. The resident owner replaces a failed worker on the
 * next request while keeping the displayed body.
 */
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyProgress } from "./IConnectedBodyProgress";

/** Keep native event callbacks and termination inside the browser adapter.
 *
 * Progress is telemetry and does not establish either completion or failure.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Settles failed and unreadable body worker requests so the last valid edit remains visible.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates browser worker replies and retires an explicitly failed connection before recovery.
 */
export function createConnectedBodyPort(
  worker: Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
): HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> {
  const waiting: IHumanResidentRequest<ConnectedBodyRequest>[] = [];
  let flight: number | undefined;
  let failed = false;
  let onError: HumanResidentPort<
    ConnectedBodyRequest,
    ConnectedBodyResult
  >["onerror"] = null;
  const fail = (message: string): void => {
    if (failed) return;
    failed = true;
    waiting.length = 0;
    flight = undefined;
    onError?.({ message });
  };
  // one request in flight; the next leaves only after its reply
  const advance = (): void => {
    if (failed || flight !== undefined) return;
    const next = waiting.shift();
    if (next === undefined) return;
    flight = next.id;
    try {
      worker.postMessage(next);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  };
  return {
    set onmessage(
      callback: HumanResidentPort<
        ConnectedBodyRequest,
        ConnectedBodyResult
      >["onmessage"],
    ) {
      worker.onmessage = (event) => {
        if (failed) return;
        const data:
          | HumanResidentReply<ConnectedBodyResult>
          | IConnectedBodyProgress = event.data;
        if ("progress" in data) return;
        if (data.id === flight) {
          flight = undefined;
        }
        callback?.({ data });
        advance();
      };
    },
    set onerror(
      callback: HumanResidentPort<
        ConnectedBodyRequest,
        ConnectedBodyResult
      >["onerror"],
    ) {
      onError = callback;
      worker.onerror = (event) =>
        fail(humanWorkerErrorMessage(event, "The body worker failed."));
      worker.onmessageerror = () =>
        fail("The body worker reply could not be read.");
    },
    postMessage: (request) => {
      if (failed) throw new Error("The body worker connection has failed.");
      waiting.push(request);
      advance();
    },
    terminate: () => {
      failed = true;
      waiting.length = 0;
      flight = undefined;
      worker.terminate();
    },
  };
}
