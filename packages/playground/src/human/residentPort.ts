import type { HumanResidentPort } from "./residentWorker";

/**
 * Adapt native worker callbacks to the typed resident request transport.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Preserves request correlation through browser message events.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps native browser allocation outside the numerical request owner.
 */
export function createHumanResidentPort<Input, Output>(
  worker: Pick<Worker, "onmessage" | "onerror" | "postMessage" | "terminate">,
): HumanResidentPort<Input, Output> {
  return {
    set onmessage(callback: HumanResidentPort<Input, Output>["onmessage"]) {
      worker.onmessage = (event) => callback?.({ data: event.data });
    },
    set onerror(callback: HumanResidentPort<Input, Output>["onerror"]) {
      worker.onerror = (event) => callback?.({ message: event.message });
    },
    postMessage: (request) => worker.postMessage(request),
    terminate: () => worker.terminate(),
  };
}
