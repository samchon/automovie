import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyProgress } from "./IConnectedBodyProgress";

/**
 * Keep native event callbacks and termination inside the browser adapter.
 *
 * Progress is telemetry and does not establish either completion or failure. Requests remain serial until the active id replies; elapsed time does not retire numerical work. Native errors or unreadable replies mark the adapter failed and clear its queue before notifying the resident owner, which owns rejection and replacement. Termination clears all native callbacks and terminates the worker. The admitted resident protocol supplies typed reply objects; this adapter performs no runtime schema validation.
 *
 * @evidence contracts/common.md#principled-implementation A FIFO plus one active correlation id serializes native evaluation, progress is ignored as telemetry, and explicit native errors retire the connection through its resident error callback.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns native handlers and termination while the resident owner owns promise correlation, rejection, replacement and displayed-frame recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timeout fabricates a failed healthy evaluation, no progress message completes a request, and the typed resident reply premise remains explicit rather than claiming runtime schema admission.
 * @evidence contracts/common.md#meaningful-documentation The comment describes serial correlation, telemetry, failure recovery ownership, native callback cleanup and the unchecked typed-protocol premise.
 * @evidence contracts/performance.md#efficient-algorithms Posting and completion perform constant correlation work plus an O(q) array shift for q waiting requests; storage is O(q) request payload references and one active id, and the numerical payload work belongs to the worker.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This native transport serializes effectful requests without deciding numerical equivalence; the resident and preview owners determine whether requests can be shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains a queue with no independent cap and native callbacks until failure or terminate; failure clears queued references, and terminate additionally clears callbacks and releases the worker.
 */
export function createConnectedBodyPort(
  worker: Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
): HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> {
  const waiting: IHumanResidentRequest<ConnectedBodyRequest>[] = [];
  let flight: number | undefined;
  let failed: boolean = false;
  let onError: HumanResidentPort<
    ConnectedBodyRequest,
    ConnectedBodyResult
  >["onerror"] = null;
  const fail: (message: string) => void = (message: string): void => {
    if (failed) return;
    failed = true;
    waiting.length = 0;
    flight = undefined;
    onError?.({ message });
  };
  // one request in flight; the next leaves only after its reply
  const advance: () => void = (): void => {
    if (failed || flight !== undefined) return;
    const next: IHumanResidentRequest<ConnectedBodyRequest> | undefined = waiting.shift();
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
      worker.onmessage = (event: MessageEvent<HumanResidentReply<ConnectedBodyResult> | IConnectedBodyProgress>): void => {
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
      worker.onerror = (event: ErrorEvent): void =>
        fail(humanWorkerErrorMessage(event, "The body worker failed."));
      worker.onmessageerror = (): void =>
        fail("The body worker reply could not be read.");
    },
    postMessage: (request: IHumanResidentRequest<ConnectedBodyRequest>): void => {
      if (failed) throw new Error("The body worker connection has failed.");
      waiting.push(request);
      advance();
    },
    terminate: (): void => {
      failed = true;
      waiting.length = 0;
      flight = undefined;
      onError = null;
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    },
  };
}
