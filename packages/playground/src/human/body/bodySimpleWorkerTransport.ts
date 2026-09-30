/**
 * Correlate the connected body editor's simple-tier expansion and projection
 * requests with replies from one browser worker. A worker failure retires that
 * connection and rejects every request it owns; the next request allocates a
 * new worker. The deadline also catches silent loss, since terminating a
 * browser Worker does not dispatch an exit event. Request IDs never repeat, and
 * callbacks from retired workers cannot affect the new connection.
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
  clock: {
    schedule: (callback: () => void, delayMs: number) => unknown;
    cancel: (handle: unknown) => void;
  } = {
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
) {
  const deadlineMs = 30_000;
  let sequence = 0;
  let worker: ReturnType<typeof factory> | undefined;
  const pending = new Map<
    number,
    {
      resolve: (value: never) => void;
      reject: (error: Error) => void;
      timer: unknown;
    }
  >();
  const retire = (error: Error): void => {
    const previous = worker;
    worker = undefined;
    for (const request of pending.values()) {
      clock.cancel(request.timer);
      request.reject(error);
    }
    pending.clear();
    previous?.terminate();
  };
  const connect = (): ReturnType<typeof factory> => {
    if (worker !== undefined) return worker;
    const current = factory();
    worker = current;
    current.onmessage = (
      event: MessageEvent<{ id: number; result?: unknown; error?: string }>,
    ) => {
      if (worker !== current) return;
      const request = pending.get(event.data.id);
      if (request === undefined) return;
      pending.delete(event.data.id);
      clock.cancel(request.timer);
      if (event.data.error !== undefined)
        request.reject(
          new Error(
            event.data.error.trim() ||
              "The body simple worker refused the request.",
          ),
        );
      else request.resolve(event.data.result as never);
    };
    current.onerror = (event: ErrorEvent) => {
      if (worker === current)
        retire(
          new Error(event.message.trim() || "The body simple worker failed."),
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
          const current = connect();
          const timer = clock.schedule(() => {
            if (worker === current && pending.has(id))
              retire(
                new Error(
                  `The body simple worker did not respond within ${deadlineMs / 1000} seconds.`,
                ),
              );
          }, deadlineMs);
          pending.set(id, {
            resolve: resolve as (value: never) => void,
            reject,
            timer,
          });
          current.postMessage({ id, ...request });
        } catch (error) {
          // Allocation and synchronous sends can fail before the worker emits
          // an event. Both invalidate the connection and all its requests.
          const reason = new Error(String(error));
          retire(reason);
          reject(reason);
        }
      }),
  };
}
