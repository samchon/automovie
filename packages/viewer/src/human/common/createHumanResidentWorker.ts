import type { HumanResidentPort } from "./HumanResidentPort.js";
import type { IHumanPendingResult } from "./IHumanPendingResult.js";
import type { HumanResidentReply } from "./HumanResidentReply.js";
import type { IHumanWorkerError } from "./IHumanWorkerError.js";
import type { IHumanWorkerMessage } from "./IHumanWorkerMessage.js";
import { humanWorkerErrorMessage } from "./humanWorkerErrorMessage.js";

/**
 * Keep one numerical worker alive across edits and correlate concurrent replies.
 * Cancelling a request withdraws its result without discarding the compiled
 * basis. Transport failure rejects every pending request; successful connection
 * retirement allows the next request to reconnect. Failed termination retains
 * the connection and original combined cause and blocks further allocation.
 * Late replies from the withdrawn connection have no authority.
 *
 * @evidence contracts/common.md#principled-implementation Lazy connection acquisition and monotonically assigned request ids correlate a pending map; current-port identity rejects stale connection replies. Cancellation deletes and rejects its pending entry without aborting numerical processing. Typed envelopes rely on the port producer's actual protocol; ids have no safe-integer exhaustion guard.
 * @evidence contracts/common.md#clear-and-simple-design One coordinator owns transport callbacks, pending settlement and lazy reconnection; body/face numerical operation grammar and browser worker construction remain supplied collaborators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every request keeps its own result; synchronous factory/postMessage failure keeps its contextual message and original Error.cause. Termination failure combines transport and cleanup causes before pending rejection, retains the port and refuses reentrant/new allocation or native retries. Shared error messages still use historical face wording; public termination completion is not a physical census.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes withdrawn result authority from worker computation cancellation, connection recovery and late-reply refusal. Disposal rejects future requests, while caller-supplied port termination is the native lifetime boundary.
 * @evidence contracts/performance.md#efficient-algorithms Normal request/reply/cancel uses map lookup and deletion; connection failure/disposal visits P pending callbacks once. Retention grows with P independently issued unsettled requests, without a configured cap or timeout.
 * @evidence contracts/performance.md#reuse-equivalent-work One live connection and its admitted numerical basis serve successful edits; successful transport cleanup permits lazy reconnection, while failed termination shares the same stored cause for future requests and repeated disposal without native retries. Equal inputs remain independently effectful and canceled ids have no reply authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The coordinator owns at most one current or failed connection and its pending map. Current ownership is withdrawn before native termination; success releases its reference and failure retains the port/cause until this owner ends. Pending callbacks leave on reply/cancel/closure, and failed retirement blocks new connection growth. An unsettled request population still has no cap or timeout.
 */
export function createHumanResidentWorker<Input, Output>(
  factory: () => HumanResidentPort<Input, Output>,
): { request: (input: Input) => { result: Promise<Output>; cancel: () => void; }; dispose: () => void; } {
  let sequence: number = 0;
  let worker: HumanResidentPort<Input, Output> | undefined;
  let disposed: boolean = false;
  /** Failure keeps the withdrawn connection reachable without retrying its native release. */
  let retirementFailure: { port: HumanResidentPort<Input, Output>; error: Error } | undefined;
  /** Reentrant requests cannot acquire a replacement before termination has settled. */
  let retiring: Error | undefined;
  const pending: Map<number, IHumanPendingResult<Output>> = new Map<number, IHumanPendingResult<Output>>();
  const close: (error: Error) => void = (error: Error): void => {
    if (retirementFailure !== undefined) throw retirementFailure.error;
    if (retiring !== undefined) throw retiring;
    const previous: HumanResidentPort<Input, Output> | undefined = worker;
    worker = undefined;
    retiring = error;
    let refusal: Error = error;
    try {
      if (previous !== undefined) {
        try {
          previous.terminate();
        } catch (cause) {
          refusal = new AggregateError([error, cause], "Resident connection retirement failed.");
          retirementFailure = { port: previous, error: refusal };
        }
      }
      for (const request of pending.values()) request.reject(refusal);
      pending.clear();
    } finally {
      retiring = undefined;
    }
    if (retirementFailure !== undefined) throw retirementFailure.error;
  };
  const connect: () => HumanResidentPort<Input, Output> = (): HumanResidentPort<Input, Output> => {
    if (retirementFailure !== undefined) throw retirementFailure.error;
    if (retiring !== undefined) throw retiring;
    if (worker !== undefined) return worker;
    const current: HumanResidentPort<Input, Output> = factory();
    worker = current;
    current.onmessage = ({ data }: IHumanWorkerMessage<HumanResidentReply<Output>>): void => {
      if (worker !== current) return;
      const request: IHumanPendingResult<Output> | undefined = pending.get(data.id);
      if (request === undefined) return;
      pending.delete(data.id);
      if (data.success) request.resolve(data.value);
      else request.reject(new Error(data.error));
    };
    current.onerror = (event: IHumanWorkerError): void => {
      if (worker === current)
        close(
          new Error(humanWorkerErrorMessage(event, "The face worker failed.")),
        );
    };
    return current;
  };
  return {
    request: (input: Input): { result: Promise<Output>; cancel: () => void; } => {
      const id: number = ++sequence;
      const result: Promise<Output> = new Promise<Output>((resolve: (value: Output | PromiseLike<Output>) => void, reject: (reason?: unknown) => void): void => {
        const refusal: Error | undefined = retirementFailure?.error ?? retiring ??
          (disposed ? new Error("The face worker has been disposed.") : undefined);
        if (refusal !== undefined) {
          reject(refusal);
          return;
        }
        pending.set(id, { resolve, reject });
        try {
          connect().postMessage({ id, input });
        } catch (error) {
          close(
            new Error(error instanceof Error ? error.message : String(error), { cause: error }),
          );
        }
      });
      return {
        result,
        cancel: (): void => {
          const request: IHumanPendingResult<Output> | undefined = pending.get(id);
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
