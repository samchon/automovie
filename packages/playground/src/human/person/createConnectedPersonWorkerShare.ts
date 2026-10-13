import type { ConnectedPersonWorkerEnd } from "./ConnectedPersonWorkerEnd";
import type { IConnectedPersonWorkerShare } from "./IConnectedPersonWorkerShare";
import { reportAutoMovieResourceRetirement } from "@automovie/viewer";

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
 * Reply routing assumes this worker's own object-shaped protocol output. Callback dispatch/retirement attempts are independent and synchronous so one callback failure does not suppress its peer, and actual failures remain reported by the canonical retirement policy.
 *
 * @evidence contracts/common.md#principled-implementation One live physical worker routes resident success envelopes and measurement replies to their own ends, progress reaches both independently, and retirement permanently refuses old posts while notifying affected transports.
 * @evidence contracts/common.md#clear-and-simple-design The share owns physical acquisition/routing/retirement only; existing preview and measurement transports keep request correlation, numerical protocols and pending settlement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The two ends are not separate physical workers, retired endpoints cannot silently post to a dead thread and a throwing callback does not prevent peer notification or hide actual retirement failures.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies one-generation sharing, object-output routing premise, independent callback attempts, peer refusal and fresh acquisition after retirement.
 * @evidence contracts/performance.md#efficient-algorithms Acquisition creates one worker and two fixed endpoint objects; each reply tests at most two protocol markers and dispatches at most two callbacks, with numerical/source loading and per-transport queue costs preserved downstream rather than counted as constant computations.
 * @evidence contracts/performance.md#reuse-equivalent-work Preview and measurement share the same live resident generation because both protocols evaluate its identical paired views; retirement clears that identity and later acquisition creates a new worker instead of reusing stale endpoints.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One share retains at most one live worker and two live ends; retirement clears live fields, detaches native handlers and attempts physical termination plus peer callbacks independently. Retired ends kept externally remain caller-owned; pending requests have no share-local count cap and leave through their actual transports' settlement/close.
 *
 * @author Samchon
 */
export function createConnectedPersonWorkerShare(
  factory: () => Worker,
): IConnectedPersonWorkerShare {
  let live: Worker | undefined;
  let preview: ConnectedPersonWorkerEnd | undefined;
  let measure: ConnectedPersonWorkerEnd | undefined;
  const retired: () => ErrorEvent = (): ErrorEvent =>
    new ErrorEvent("error", {
      message: "The shared person worker was retired.",
    });
  function retire(worker: Worker, notifications: readonly (() => void)[]): void {
    if (live !== worker) return;
    live = undefined;
    preview = undefined;
    measure = undefined;
    reportAutoMovieResourceRetirement([
      (): void => { worker.onmessage = null; },
      (): void => { worker.onerror = null; },
      (): void => { worker.onmessageerror = null; },
      (): void => worker.terminate(),
      ...notifications,
    ]);
  }
  const end: (worker: Worker, peer: () => ConnectedPersonWorkerEnd | undefined) => ConnectedPersonWorkerEnd = (
    worker: Worker,
    peer: () => ConnectedPersonWorkerEnd | undefined,
  ): ConnectedPersonWorkerEnd => ({
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: (message: unknown): void => {
      if (live !== worker) throw new Error("The shared person worker was retired.");
      worker.postMessage(message);
    },
    terminate: (): void => {
      if (live !== worker) return;
      const other: ConnectedPersonWorkerEnd | undefined = peer();
      retire(worker, [(): void => { other?.onerror?.call(worker, retired()); }]);
    },
  });
  const open: () => void = (): void => {
    if (live !== undefined) return;
    const worker: Worker = factory();
    const previewEnd: ConnectedPersonWorkerEnd = end(worker, (): ConnectedPersonWorkerEnd => measureEnd);
    const measureEnd: ConnectedPersonWorkerEnd = end(worker, (): ConnectedPersonWorkerEnd => previewEnd);
    live = worker;
    preview = previewEnd;
    measure = measureEnd;
    worker.onmessage = (event: MessageEvent<object>): void => {
      if (live !== worker) return;
      const data: object = event.data;
      reportAutoMovieResourceRetirement([
        (): void => { if ("progress" in data || "success" in data) previewEnd.onmessage?.call(worker, event); },
        (): void => { if ("progress" in data || !("success" in data)) measureEnd.onmessage?.call(worker, event); },
      ]);
    };
    worker.onerror = (event: ErrorEvent): void => {
      if (live !== worker) return;
      retire(worker, [
        (): void => { previewEnd.onerror?.call(worker, event); },
        (): void => { measureEnd.onerror?.call(worker, event); },
      ]);
    };
    worker.onmessageerror = (event: MessageEvent<unknown>): void => {
      if (live !== worker) return;
      reportAutoMovieResourceRetirement([
        (): void => { previewEnd.onmessageerror?.call(worker, event); },
        (): void => { measureEnd.onmessageerror?.call(worker, event); },
      ]);
    };
  };
  return {
    preview: (): ConnectedPersonWorkerEnd => {
      open();
      return preview!;
    },
    measure: (): ConnectedPersonWorkerEnd => {
      open();
      return measure!;
    },
  };
}
