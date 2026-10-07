import type { ConnectedPersonWorkerEnd } from "./ConnectedPersonWorkerEnd";
import type { IConnectedPersonWorkerShare } from "./IConnectedPersonWorkerShare";

/**
 * Share one resident person worker between the preview transport and the
 * measurement transport.
 *
 * A person generation's views are hundreds of megabytes once parsed. Two
 * workers each reading them, beside the page's own copy, exceeded what one
 * page can hold on a large generation: the page died a few accepted edits
 * after the measurement worker started. One worker reads the views once and
 * answers both protocols.
 *
 * Replies are routed by their own shape: a resident reply states `success`,
 * a measurement reply does not. A stage signal goes to both ends, since
 * either may have the request in flight. Terminating either end retires the
 * worker for both: the other end is told through its error callback, and each
 * transport gets the end of a fresh worker the next time it asks.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Runs the person editor's preview and measurements on one worker so a large generation stays within one page.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Retires the shared worker for both transports on a failure and lets each recover on its next request.
 * @author Samchon
 */
export function createConnectedPersonWorkerShare(factory: () => Worker): IConnectedPersonWorkerShare {
  let live: Worker | undefined;
  let preview: ConnectedPersonWorkerEnd | undefined;
  let measure: ConnectedPersonWorkerEnd | undefined;
  const retired = (): ErrorEvent => new ErrorEvent("error", { message: "The shared person worker was retired." });
  const end = (worker: Worker, peer: () => ConnectedPersonWorkerEnd | undefined): ConnectedPersonWorkerEnd => ({
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: (message: unknown) => worker.postMessage(message),
    terminate: () => {
      if (live !== worker) return;
      const other = peer();
      live = undefined;
      worker.terminate();
      other?.onerror?.call(worker, retired());
    },
  });
  const open = (): void => {
    if (live !== undefined) return;
    const worker = factory();
    const previewEnd = end(worker, () => measureEnd);
    const measureEnd = end(worker, () => previewEnd);
    live = worker;
    preview = previewEnd;
    measure = measureEnd;
    worker.onmessage = (event: MessageEvent) => {
      if (live !== worker) return;
      const data: object = event.data;
      if ("progress" in data || "success" in data) previewEnd.onmessage?.call(worker, event);
      if ("progress" in data || !("success" in data)) measureEnd.onmessage?.call(worker, event);
    };
    worker.onerror = (event) => {
      if (live !== worker) return;
      live = undefined;
      worker.terminate();
      previewEnd.onerror?.call(worker, event);
      measureEnd.onerror?.call(worker, event);
    };
    worker.onmessageerror = (event) => {
      if (live !== worker) return;
      previewEnd.onmessageerror?.call(worker, event);
      measureEnd.onmessageerror?.call(worker, event);
    };
  };
  return {
    preview: () => {
      open();
      return preview!;
    },
    measure: () => {
      open();
      return measure!;
    },
  };
}
