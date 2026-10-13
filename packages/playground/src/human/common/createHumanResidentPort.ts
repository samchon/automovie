import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";

/**
 * Adapt browser Worker callbacks to the resident request transport, forwarding native errors and unreadable replies as connection failures.
 *
 * The resident owner correlates requests and rejects failures; this adapter trusts that worker replies follow the shared typed protocol and performs no runtime schema admission. Termination detaches native callbacks and ends the worker, after which posting refuses.
 *
 * @evidence contracts/common.md#principled-implementation Native message, error and messageerror seams forward protocol data or explicit failure to the resident owner, while permanent closure prevents sending into a terminated connection.
 * @evidence contracts/common.md#clear-and-simple-design Native callback wiring and termination stay in this browser adapter; correlation, request rejection and replacement remain with the resident transport owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native failure remains observable without a guessed timeout, and typed forwarding explicitly does not claim malformed-message schema validation.
 * @evidence contracts/common.md#meaningful-documentation The comment names native and unreadable errors, resident correlation ownership, unchecked protocol premise and detached callbacks after termination.
 * @evidence contracts/performance.md#efficient-algorithms Each callback performs constant adapter work and postMessage transfers a payload according to native structured-clone costs; this adapter adds no request queue or payload copy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The adapter forwards effectful messages without deciding numerical equivalence or sharing responses; request reuse belongs to the resident owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One native worker and installed callback closures remain reachable until termination, which detaches message, error and messageerror handlers and ends the worker; no adapter-owned pending list grows with requests.
 */
export function createHumanResidentPort<Input, Output>(
  worker: Pick<Worker, "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate">,
): HumanResidentPort<Input, Output> {
  let closed: boolean = false;
  return {
    set onmessage(callback: HumanResidentPort<Input, Output>["onmessage"]) {
      worker.onmessage = callback === null ? null : (event: MessageEvent<HumanResidentReply<Output>>): void => { if (!closed) callback({ data: event.data }); };
    },
    set onerror(callback: HumanResidentPort<Input, Output>["onerror"]) {
      worker.onerror = callback === null ? null : (event: ErrorEvent): void =>
        callback?.({
          message: humanWorkerErrorMessage(event, "The face worker failed."),
        });
      worker.onmessageerror = callback === null ? null : (): void => callback({ message: "The worker reply could not be read." });
    },
    postMessage: (request: IHumanResidentRequest<Input>): void => {
      if (closed) throw new Error("The worker connection is closed.");
      worker.postMessage(request);
    },
    terminate: (): void => {
      if (closed) return;
      closed = true;
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    },
  };
}
