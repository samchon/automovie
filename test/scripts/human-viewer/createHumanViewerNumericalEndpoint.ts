import { parse, stringify } from "devalue";

import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage";
import type { IHumanViewerNumericalEndpoint } from "./IHumanViewerNumericalEndpoint";

/**
 * Carry the original checked Node result to the browser with one pinned codec.
 * The event stream is the owned process lifetime; endpoint/frame disposal
 * cancels actual computation. Individual port retirement withdraws its result
 * authority while the shared realm remains resident. No browser evaluator
 * or preview-cache fallback is introduced.
 * @evidence contracts/common.md#principled-implementation The same devalue codec preserves structured result types and references on both sides while correlation remains with the numerical port.
 * @evidence contracts/common.md#clear-and-simple-design One stream carries actual readiness, progress and replies; posts carry only original requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This owned adapter implements a protocol; it changes no foreign Worker method or model value.
 * @evidence contracts/common.md#meaningful-documentation States codec parity and stream-owned cancellation.
 */
export function createHumanViewerNumericalEndpoint(): IHumanViewerNumericalEndpoint {
  const controller = new AbortController();
  let session: string | undefined;
  let open: (value: string) => void = () => {};
  let failed: (error: Error) => void = () => {};
  const ready = new Promise<string>((resolve, reject) => { open = resolve; failed = reject; });
  ready.catch(() => undefined);
  const endpoint: IHumanViewerNumericalEndpoint = {
    onmessage: null,
    onerror: null,
    postMessage: (message) => {
      void ready.then(async (id) => {
        const response = await fetch("/numerical/" + id, {
          method: "POST",
          body: stringify(message),
          signal: controller.signal,
          headers: { "Content-Type": "application/x-devalue" },
        });
        if (!response.ok) throw new Error(await response.text());
      }).catch(report);
    },
    terminate: () => {
      controller.abort();
      failed(new Error("The owned Node numerical endpoint was retired."));
      if (session !== undefined)
        void fetch("/numerical/" + session, { method: "DELETE", keepalive: true }).catch(() => undefined);
    },
  };
  const report = (cause: unknown): void => {
    if (controller.signal.aborted) return;
    const error = cause instanceof Error ? cause : new Error(String(cause));
    failed(error);
    endpoint.onerror?.(new ErrorEvent("error", { message: error.message }));
  };
  void (async () => {
    const response = await fetch("/numerical/events", { signal: controller.signal });
    if (!response.ok || response.body === null) throw new Error(await response.text());
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        if (!controller.signal.aborted) throw new Error("The Node numerical realm ended.");
        return;
      }
      pending += decoder.decode(value, { stream: true });
      let at: number;
      while ((at = pending.indexOf("\n")) !== -1) {
        const line = pending.slice(0, at);
        pending = pending.slice(at + 1);
        const message = parse(line) as HumanViewerNumericalMessage;
        if ("type" in message && message.type === "opened") {
          session = message.session;
        } else if ("type" in message && message.type === "ready") {
          if (session === undefined) throw new Error("Numerical readiness preceded its owned session.");
          endpoint.onmessage?.(new MessageEvent("message", { data: message }));
          open(session);
        } else if ("type" in message && message.type === "failure") {
          const error = new Error(message.error);
          if (message.stack !== undefined) error.stack = message.stack;
          throw error;
        } else endpoint.onmessage?.(new MessageEvent("message", { data: message }));
      }
    }
  })().catch(report);
  return endpoint;
}
