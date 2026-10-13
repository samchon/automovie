import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";

/** Adapt native worker callbacks to the typed resident request transport. */
export function createHumanResidentPort<Input, Output>(
  worker: Pick<Worker, "onmessage" | "onerror" | "postMessage" | "terminate">,
): HumanResidentPort<Input, Output> {
  return {
    set onmessage(callback: HumanResidentPort<Input, Output>["onmessage"]) {
      worker.onmessage = (event) => callback?.({ data: event.data });
    },
    set onerror(callback: HumanResidentPort<Input, Output>["onerror"]) {
      worker.onerror = (event) =>
        callback?.({
          message: humanWorkerErrorMessage(event, "The face worker failed."),
        });
    },
    postMessage: (request) => worker.postMessage(request),
    terminate: () => worker.terminate(),
  };
}
