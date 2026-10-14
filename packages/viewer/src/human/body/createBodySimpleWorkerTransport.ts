import type { IHumanPendingResult } from "@automovie/viewer/human/common/IHumanPendingResult";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";

import type { IBodySimpleReply } from "@automovie/human/body/runtime/IBodySimpleReply";
import type { IBodySimpleWorkerTransport } from "@automovie/viewer/human/body/IBodySimpleWorkerTransport";
import type { IConnectedBodyProgress } from "@automovie/viewer/human/body/IConnectedBodyProgress";

/**
 * Correlate the connected body editor's simple-tier expansion and projection requests with replies from one browser worker. A worker failure retires that connection and rejects every request it owns; the next request allocates a new worker. A request leaves only after the preceding reply. Elapsed time never retires a valid evaluation. Request IDs never repeat, and callbacks from retired workers cannot affect the new connection.
 *
 * The page supplies the native worker factory. A numerical error reply belongs to one request and leaves the worker available. Permanent close rejects all pending callers and prevents reconnection. Reply payloads are not runtime-validated against the caller's generic result type.
 *
 * @evidence contracts/common.md#principled-implementation Monotonic safe-integer IDs correlate promises, insertion-ordered waiting requests preserve one-flight execution, and connection identity rejects authority from retired-worker callbacks.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns native event handlers, request progression and permanent closure; numerical operation semantics stay with worker payloads and typed service callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual replies advance the queue without a silence timeout, and the unchecked generic payload cast is documented as a protocol limitation rather than claimed validation.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes numerical refusal from connection failure, replacement from permanent closure and generic typing from runtime payload admission.
 * @evidence contracts/performance.md#efficient-algorithms Map insertion, lookup and deletion use expected constant work per request or reply; connection retirement visits all p pending callers once to reject them and clear their queued payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Healthy requests reuse one native worker and its loaded numerical basis, while failed connections are replaced; requests are not merged solely because their payloads match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One transport owns at most one worker and one active send; queued payloads and promises grow with outstanding callers without a fixed population cap. Replies remove requests, failure clears both maps and terminates the worker, and permanent close also blocks reconnection.
 */
export function createBodySimpleWorkerTransport(
  factory: () => Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
): IBodySimpleWorkerTransport {
  let sequence: number = 0;
  let closed: boolean = false;
  let worker: ReturnType<typeof factory> | undefined;
  let flight: number | undefined;
  const pending: Map<number, IHumanPendingResult<unknown>> = new Map();
  const waiting: Map<number, object> = new Map();
  const retire: (error: Error) => void = (error: Error): void => {
    const previous: typeof worker = worker;
    worker = undefined;
    flight = undefined;
    waiting.clear();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    if (previous !== undefined) {
      previous.onmessage = null;
      previous.onerror = null;
      previous.onmessageerror = null;
      previous.terminate();
    }
  };
  // one request in flight; the next leaves only after its reply
  const advance: () => void = (): void => {
    const current: typeof worker = worker;
    if (current === undefined || flight !== undefined) return;
    const next: IteratorResult<[number, object], undefined> = waiting
      .entries()
      .next();
    if (next.done === true) return;
    const [id, request]: [number, object] = next.value;
    waiting.delete(id);
    flight = id;
    try {
      current.postMessage({ id, ...request });
    } catch (error) {
      // a synchronous send failure invalidates the connection and its requests
      retire(new Error(String(error)));
    }
  };
  const connect: () => ReturnType<typeof factory> = (): ReturnType<
    typeof factory
  > => {
    if (closed) throw new Error("The body simple worker transport is closed.");
    if (worker !== undefined) return worker;
    const current: ReturnType<typeof factory> = factory();
    worker = current;
    current.onmessage = (
      event: MessageEvent<IBodySimpleReply | IConnectedBodyProgress>,
    ): void => {
      if (worker !== current) return;
      const data: IBodySimpleReply | IConnectedBodyProgress = event.data;
      if ("progress" in data) return;
      if (data.id === flight) {
        flight = undefined;
      }
      const request: IHumanPendingResult<unknown> | undefined = pending.get(
        data.id,
      );
      pending.delete(data.id);
      if (request !== undefined) {
        if (data.error !== undefined)
          request.reject(
            new Error(
              data.error.trim() ||
                "The body simple worker refused the request.",
            ),
          );
        else request.resolve(data.result);
      }
      advance();
    };
    current.onerror = (event: ErrorEvent): void => {
      if (worker === current)
        retire(
          new Error(
            humanWorkerErrorMessage(event, "The body simple worker failed."),
          ),
        );
    };
    current.onmessageerror = (): void => {
      if (worker === current)
        retire(new Error("The body simple worker reply could not be read."));
    };
    return current;
  };
  return {
    ask: <T>(request: object): Promise<T> => {
      if (closed || sequence === Number.MAX_SAFE_INTEGER)
        return Promise.reject(
          new Error(
            closed
              ? "The body simple worker transport is closed."
              : "The body simple worker request identities are exhausted.",
          ),
        );
      const id: number = ++sequence;
      return new Promise<T>(
        (
          resolve: (value: T | PromiseLike<T>) => void,
          reject: (reason?: unknown) => void,
        ): void => {
          pending.set(id, {
            resolve: (value: unknown): void => resolve(value as T),
            reject,
          });
          try {
            connect();
            waiting.set(id, request);
            advance();
          } catch (error) {
            // Allocation can fail before the worker emits an event. It
            // invalidates the connection and all its requests.
            const reason: Error = new Error(String(error));
            retire(reason);
          }
        },
      );
    },
    close: (): void => {
      closed = true;
      retire(new Error("The body simple worker transport is closed."));
    },
  };
}
