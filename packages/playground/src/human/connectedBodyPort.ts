/**
 * Native transport for correlated body preview and export calls. A browser
 * Worker has no exit event when terminated elsewhere, so each unanswered
 * request has a conservative deadline. The resident request owner receives
 * one body-specific transport error and replaces the failed worker next time.
 */
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "./connectedBodyProtocol";
import type { HumanResidentPort } from "./residentWorker";

/** Keep native event callbacks and termination inside the browser adapter. */
export function createConnectedBodyPort(
  worker: Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
  clock: {
    schedule: (callback: () => void, delayMs: number) => unknown;
    cancel: (handle: unknown) => void;
  } = {
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
): HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> {
  const deadlineMs = 60_000;
  const timers = new Map<number, unknown>();
  let failed = false;
  let onError: HumanResidentPort<
    ConnectedBodyRequest,
    ConnectedBodyResult
  >["onerror"] = null;
  const clear = (): void => {
    for (const handle of timers.values()) clock.cancel(handle);
    timers.clear();
  };
  const fail = (message: string): void => {
    if (failed) return;
    failed = true;
    clear();
    onError?.({ message });
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
        if (timers.has(event.data.id)) {
          clock.cancel(timers.get(event.data.id));
          timers.delete(event.data.id);
        }
        callback?.({ data: event.data });
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
        fail(event.message.trim() || "The body worker failed.");
      worker.onmessageerror = () =>
        fail("The body worker reply could not be read.");
    },
    postMessage: (request) => {
      if (failed) throw new Error("The body worker connection has failed.");
      const handle = clock.schedule(() => {
        if (timers.has(request.id))
          fail(
            `The body worker did not respond within ${deadlineMs / 1000} seconds.`,
          );
      }, deadlineMs);
      timers.set(request.id, handle);
      try {
        worker.postMessage(request);
      } catch (error) {
        clock.cancel(handle);
        timers.delete(request.id);
        throw error;
      }
    },
    terminate: () => {
      failed = true;
      clear();
      worker.terminate();
    },
  };
}
