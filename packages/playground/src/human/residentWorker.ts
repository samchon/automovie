/** A reply is correlated with the request that owns it, including failures. */
export type HumanResidentReply<Output> =
  | { id: number; success: true; value: Output }
  | { id: number; success: false; error: string };

/** Browser transport only; the request owner does not allocate browser globals. */
export type HumanResidentPort<Input, Output> = {
  /** Current correlated response callback; null detaches the consumer. */
  onmessage: ((event: { data: HumanResidentReply<Output> }) => void) | null;
  /** Transport failures invalidate all requests owned by this connection. */
  onerror: ((event: { message: string }) => void) | null;
  /** Send an immutable request envelope to the numerical worker. */
  postMessage: (request: { id: number; input: Input }) => void;
  /** Stop this connection after a transport failure or final disposal. */
  terminate: () => void;
};

/**
 * Keep one numerical worker alive across edits and correlate concurrent replies.
 * Cancelling a request withdraws its result without discarding the compiled
 * basis. Transport failure rejects every pending request and the next request
 * starts a fresh worker. Late replies from that failed worker have no authority.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps obsolete worker responses from changing the committed face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Correlates resident worker requests and recovers after a transport failure.
 */
export function createHumanResidentWorker<Input, Output>(
  factory: () => HumanResidentPort<Input, Output>,
) {
  let sequence = 0;
  let worker: HumanResidentPort<Input, Output> | undefined;
  let disposed = false;
  const pending = new Map<
    number,
    { resolve: (value: Output) => void; reject: (error: Error) => void }
  >();
  const close = (error: Error): void => {
    const previous = worker;
    worker = undefined;
    previous?.terminate();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  const connect = (): HumanResidentPort<Input, Output> => {
    if (worker !== undefined) return worker;
    const current = factory();
    worker = current;
    current.onmessage = ({ data }) => {
      if (worker !== current) return;
      const request = pending.get(data.id);
      if (request === undefined) return;
      pending.delete(data.id);
      if (data.success) request.resolve(data.value);
      else request.reject(new Error(data.error));
    };
    current.onerror = ({ message }) => {
      if (worker === current)
        close(new Error(message.trim() || "The face worker failed."));
    };
    return current;
  };
  return {
    request: (input: Input) => {
      const id = ++sequence;
      const result = new Promise<Output>((resolve, reject) => {
        if (disposed) {
          reject(new Error("The face worker has been disposed."));
          return;
        }
        pending.set(id, { resolve, reject });
        try {
          connect().postMessage({ id, input });
        } catch (error) {
          close(
            new Error(error instanceof Error ? error.message : String(error)),
          );
        }
      });
      return {
        result,
        cancel: (): void => {
          const request = pending.get(id);
          pending.delete(id);
          request?.reject(new Error("Superseded by a newer face request."));
        },
      };
    },
    dispose: (): void => {
      disposed = true;
      close(new Error("The face worker has been disposed."));
    },
  };
}
