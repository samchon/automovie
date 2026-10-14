import { parse, stringify } from "devalue";

import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";
import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage.js";
import type { IHumanViewerNumericalEndpoint } from "./IHumanViewerNumericalEndpoint.js";

/**
 * Carry the original checked Node result to the browser with one pinned codec. The event stream is the owned process lifetime; endpoint/frame disposal aborts transport and requests best-effort session deletion rather than proving actual computation ended. Individual port retirement withdraws its result authority while the shared realm remains resident. No browser evaluator or preview-cache fallback is introduced. A failed stream or post ends this endpoint once, requests owned session retirement, and refuses every later post. Explicit disposal requests the same cleanup without notifying a new endpoint failure; server termination refusal remains outside this best-effort DELETE completion. A measured source change preserves its error identity on both the stream and a rejected post, whichever reaches the browser first.
 *
 * @evidence contracts/common.md#principled-implementation One NDJSON event stream announces session/readiness and carries pinned devalue envelopes; posts target that same owned session and measured source-change failures retain their error class.
 * @evidence contracts/common.md#clear-and-simple-design A readiness promise, terminal failure and AbortController coordinate request dispatch with stream lifetime rather than implementing numerical evaluation in the browser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness before a session is refused, HTTP failure cannot become a successful post and terminal endpoints refuse subsequent work without replay or cache fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies session ownership, failure/disposal behavior and source-change identity across independent stream/post delivery.
 * @evidence contracts/performance.md#efficient-algorithms Streaming decodes received chunks and parses complete lines; string concatenation/slicing can copy accumulated data repeatedly for a large line, and no fixed line-size bound is supplied here.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent posts share this endpoint's readiness but retain distinct messages; terminal state prevents retrying old work or substituting another session's source authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Termination aborts owned fetches and requests session DELETE, and stream settlement releases its reader lock; pending line bytes and concurrent posts have no independent cap, while DELETE is best effort rather than proof of child exit.
 */
export function createHumanViewerNumericalEndpoint(): IHumanViewerNumericalEndpoint {
  const controller: AbortController = new AbortController();
  let session: string | undefined;
  let terminal: Error | undefined;
  let open: (value: string) => void = (): void => {};
  let failed: (error: Error) => void = (): void => {};
  const ready: Promise<string> = new Promise<string>(
    (
      resolve: (value: string) => void,
      reject: (error: Error) => void,
    ): void => {
      open = resolve;
      failed = reject;
    },
  );
  ready.catch((): undefined => undefined);
  const release: () => void = (): void => {
    controller.abort();
    if (session !== undefined)
      void fetch("/numerical/" + session, {
        method: "DELETE",
        keepalive: true,
      }).catch((): undefined => undefined);
  };
  const endpoint: IHumanViewerNumericalEndpoint = {
    onmessage: null,
    onerror: null,
    postMessage: (
      message: Parameters<IHumanViewerNumericalEndpoint["postMessage"]>[0],
    ): void => {
      if (terminal !== undefined) throw terminal;
      void ready
        .then(async (id: string): Promise<void> => {
          if (terminal !== undefined) throw terminal;
          const response: Response = await fetch("/numerical/" + id, {
            method: "POST",
            body: stringify(message),
            signal: controller.signal,
            headers: { "Content-Type": "application/x-devalue" },
          });
          if (!response.ok) {
            const message: string = await response.text();
            throw response.headers.get("X-Human-Viewer-Source-Changed") ===
              "true"
              ? new HumanViewerNodeSourceChangedError(message)
              : new Error(message);
          }
        })
        .catch(report);
    },
    terminate: (): void => {
      if (terminal !== undefined) return;
      terminal = new Error("The owned Node numerical endpoint was retired.");
      failed(terminal);
      release();
    },
  };
  const report: (cause: unknown) => void = (cause: unknown): void => {
    if (terminal !== undefined) return;
    const error: Error =
      cause instanceof Error ? cause : new Error(String(cause));
    terminal = error;
    failed(error);
    release();
    endpoint.onerror?.(
      new ErrorEvent("error", { message: error.message, error }),
    );
  };
  void (async (): Promise<void> => {
    const response: Response = await fetch("/numerical/events", {
      signal: controller.signal,
    });
    if (!response.ok || response.body === null)
      throw new Error(await response.text());
    const reader: ReadableStreamDefaultReader<Uint8Array> =
      response.body.getReader();
    const decoder: TextDecoder = new TextDecoder();
    let pending: string = "";
    try {
      for (;;) {
        const { value, done }: ReadableStreamReadResult<Uint8Array> =
          await reader.read();
        if (done) {
          if (!controller.signal.aborted)
            throw new Error("The Node numerical realm ended.");
          return;
        }
        pending += decoder.decode(value, { stream: true });
        let at: number;
        while ((at = pending.indexOf("\n")) !== -1) {
          if (terminal !== undefined) return;
          const line: string = pending.slice(0, at);
          pending = pending.slice(at + 1);
          const message: HumanViewerNumericalMessage = parse(
            line,
          ) as HumanViewerNumericalMessage;
          if ("type" in message && message.type === "opened") {
            session = message.session;
          } else if ("type" in message && message.type === "ready") {
            if (session === undefined)
              throw new Error(
                "Numerical readiness preceded its owned session.",
              );
            endpoint.onmessage?.(
              new MessageEvent("message", { data: message }),
            );
            open(session);
          } else if ("type" in message && message.type === "failure") {
            const error: Error =
              message.sourceChanged === true
                ? new HumanViewerNodeSourceChangedError(message.error)
                : new Error(message.error);
            if (message.stack !== undefined) error.stack = message.stack;
            throw error;
          } else
            endpoint.onmessage?.(
              new MessageEvent("message", { data: message }),
            );
        }
      }
    } finally {
      reader.releaseLock();
    }
  })().catch(report);
  return endpoint;
}
