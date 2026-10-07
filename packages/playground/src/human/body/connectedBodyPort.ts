/**
 * Native transport for correlated body preview and export calls. A browser
 * Worker has no exit event when terminated elsewhere, so the transport retires
 * a connection that has gone silent. Silence is measured on the one request the
 * worker is actually answering: a request waits here until the worker has
 * replied to the one before it, so time spent behind an earlier evaluation is
 * never counted against a later request, and a stage signal from the worker
 * (`IConnectedBodyProgress`) restarts the measurement. The resident request
 * owner receives one body-specific transport error and replaces the failed
 * worker next time.
 */
import type { HumanResidentPort } from "../common/HumanResidentPort";
import type { HumanResidentReply } from "../common/HumanResidentReply";
import type { IHumanResidentRequest } from "../common/IHumanResidentRequest";
import type { IHumanWorkerClock } from "../common/IHumanWorkerClock";
import { humanWorkerErrorMessage } from "../common/humanWorkerErrorMessage";
import { CONNECTED_BODY_STAGE_SILENCE_MS } from "./CONNECTED_BODY_STAGE_SILENCE_MS";
import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import type { IConnectedBodyProgress } from "./IConnectedBodyProgress";

/** Keep native event callbacks and termination inside the browser adapter.
 *
 * `silenceMs` bounds one uninterrupted stage of the worker, not a whole
 * request: a numerical evaluation is one synchronous stage, and a static
 * encoding reports each of its stages. A worker that neither replies nor
 * signals within it is treated as lost.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Settles failed and unreadable body worker requests so the last valid edit remains visible.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates browser worker replies and retires a silent or failed connection before recovery.
 */
export function createConnectedBodyPort(
  worker: Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
  clock: IHumanWorkerClock = {
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
): HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> {
  const silenceMs = CONNECTED_BODY_STAGE_SILENCE_MS;
  const waiting: IHumanResidentRequest<ConnectedBodyRequest>[] = [];
  let flight: number | undefined;
  let timer: unknown;
  let failed = false;
  let onError: HumanResidentPort<
    ConnectedBodyRequest,
    ConnectedBodyResult
  >["onerror"] = null;
  const quiet = (): void => {
    if (timer !== undefined) clock.cancel(timer);
    timer = undefined;
  };
  const fail = (message: string): void => {
    if (failed) return;
    failed = true;
    quiet();
    waiting.length = 0;
    flight = undefined;
    onError?.({ message });
  };
  const listen = (): void => {
    quiet();
    timer = clock.schedule(
      () =>
        fail(
          `The body worker sent no reply or stage signal for ${silenceMs / 1000} seconds.`,
        ),
      silenceMs,
    );
  };
  // one request in flight; the next leaves only after its reply
  const advance = (): void => {
    if (failed || flight !== undefined) return;
    const next = waiting.shift();
    if (next === undefined) return;
    flight = next.id;
    listen();
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
        if ("progress" in data) {
          if (flight !== undefined) listen();
          return;
        }
        if (data.id === flight) {
          quiet();
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
      quiet();
      waiting.length = 0;
      flight = undefined;
      worker.terminate();
    },
  };
}
