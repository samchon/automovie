import { humanWorkerErrorMessage } from "../common/humanWorkerErrorMessage";
import type { IHumanWorkerClock } from "../common/IHumanWorkerClock";
import type { IHumanPendingResult } from "../common/IHumanPendingResult";
import type { IConnectedBodyProgress } from "./IConnectedBodyProgress";
import type { IBodySimpleReply } from "./IBodySimpleReply";

/**
 * Correlate the connected body editor's simple-tier expansion and projection
 * requests with replies from one browser worker. A worker failure retires that
 * connection and rejects every request it owns; the next request allocates a
 * new worker. A silence deadline also catches silent loss, since terminating a
 * browser Worker does not dispatch an exit event. Silence is measured on the
 * one request the worker is answering: a request leaves only after the reply
 * to the one before it, so waiting behind an earlier evaluation is never
 * counted, and a stage signal (`IConnectedBodyProgress`) restarts it. A
 * deadline counted from the moment of asking retired a healthy worker whenever
 * several evaluations were asked at once, and the replacement worker then
 * loaded its whole source again. Request IDs never repeat, and callbacks from
 * retired workers cannot affect the new connection.
 *
 * `silenceMs` bounds one uninterrupted stage of the worker. A worker shared
 * with another protocol passes that protocol's bound, because a request here
 * can wait behind one of its stages.
 *
 * The page supplies the native worker factory. The optional clock lets the
 * unit test advance a lost worker without waiting for real time. A numerical
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
  clock: IHumanWorkerClock = {
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
  silenceMs: number = 30_000,
) {
  let sequence = 0;
  let worker: ReturnType<typeof factory> | undefined;
  let flight: number | undefined;
  let timer: unknown;
  const pending = new Map<number, IHumanPendingResult<never>>();
  const waiting = new Map<number, object>();
  const quiet = (): void => {
    if (timer !== undefined) clock.cancel(timer);
    timer = undefined;
  };
  const retire = (error: Error): void => {
    const previous = worker;
    worker = undefined;
    flight = undefined;
    quiet();
    waiting.clear();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    previous?.terminate();
  };
  const listen = (current: ReturnType<typeof factory>): void => {
    quiet();
    timer = clock.schedule(() => {
      if (worker === current && flight !== undefined)
        retire(
          new Error(
            `The body simple worker sent no reply or stage signal for ${silenceMs / 1000} seconds.`,
          ),
        );
    }, silenceMs);
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
    listen(current);
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
      if ("progress" in data) {
        if (flight !== undefined) listen(current);
        return;
      }
      if (data.id === flight) {
        quiet();
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
          new Error(humanWorkerErrorMessage(event, "The body simple worker failed.")),
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
          pending.set(id, { resolve: resolve as (value: never) => void, reject });
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
