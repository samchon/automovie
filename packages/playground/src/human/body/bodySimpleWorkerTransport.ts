import type { IHumanPendingResult } from "@automovie/viewer/human/common/IHumanPendingResult";
import { humanWorkerErrorMessage } from "@automovie/viewer/human/common/humanWorkerErrorMessage";
import type { IBodySimpleReply } from "./IBodySimpleReply";
import type { IConnectedBodyProgress } from "./IConnectedBodyProgress";

/**
 * Correlate the connected body editor's simple-tier expansion and projection
 * requests with replies from one browser worker. A worker failure retires that
 * connection and rejects every request it owns; the next request allocates a
 * new worker. A request leaves only after the preceding reply. Elapsed time
 * never retires a valid evaluation. Request IDs never repeat, and callbacks from
 * retired workers cannot affect the new connection.
 *
 * The page supplies the native worker factory. A numerical
 * error reply belongs to one request and leaves the worker available.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Ensures a failed simple-tier edit reports a reason while the panel retains the last committed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Settles pending body worker requests after transport failure and permits a later edit to recover.
 */
export function createBodySimpleWorkerTransport(
  factory: () => Pick<
    Worker,
    "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
  >,
) {
  let sequence = 0;
  let worker: ReturnType<typeof factory> | undefined;
  let flight: number | undefined;
  const pending = new Map<number, IHumanPendingResult<never>>();
  const waiting = new Map<number, object>();
  const retire = (error: Error): void => {
    const previous = worker;
    worker = undefined;
    flight = undefined;
    waiting.clear();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    previous?.terminate();
  };
  // one request in flight; the next leaves only after its reply
  const advance = (): void => {
    const current = worker;
    if (current === undefined || flight !== undefined) return;
    const next = waiting.entries().next();
    if (next.done === true) return;
    const [id, request] = next.value;
    waiting.delete(id);
    flight = id;
    try {
      current.postMessage({ id, ...request });
    } catch (error) {
      // a synchronous send failure invalidates the connection and its requests
      retire(new Error(String(error)));
    }
  };
  const connect = (): ReturnType<typeof factory> => {
    if (worker !== undefined) return worker;
    const current = factory();
    worker = current;
    current.onmessage = (
      event: MessageEvent<IBodySimpleReply | IConnectedBodyProgress>,
    ) => {
      if (worker !== current) return;
      const data = event.data;
      if ("progress" in data) return;
      if (data.id === flight) {
        flight = undefined;
      }
      const request = pending.get(data.id);
      pending.delete(data.id);
      if (request !== undefined) {
        if (data.error !== undefined)
          request.reject(
            new Error(
              data.error.trim() ||
                "The body simple worker refused the request.",
            ),
          );
        else request.resolve(data.result as never);
      }
      advance();
    };
    current.onerror = (event: ErrorEvent) => {
      if (worker === current)
        retire(
          new Error(
            humanWorkerErrorMessage(event, "The body simple worker failed."),
          ),
        );
    };
    current.onmessageerror = () => {
      if (worker === current)
        retire(new Error("The body simple worker reply could not be read."));
    };
    return current;
  };
  return {
    ask: <T>(request: object): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const id = ++sequence;
        try {
          connect();
          pending.set(id, {
            resolve: resolve as (value: never) => void,
            reject,
          });
          waiting.set(id, request);
          advance();
        } catch (error) {
          // Allocation can fail before the worker emits an event. It
          // invalidates the connection and all its requests.
          const reason = new Error(String(error));
          retire(reason);
          reject(reason);
        }
      }),
  };
}
