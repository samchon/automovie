/**
 * Correlate captures with the browser transport that can complete them.
 * A reported page or browser failure rejects outstanding captures explicitly
 * instead of leaving the queue dependent on an unreachable page promise.
 * This owner supplies no elapsed-time policy and never restarts a process.
 *
 * @evidence contracts/common.md#principled-implementation Transport failure withdraws each pending operation before queue ownership can pass to the next request.
 * @evidence contracts/common.md#clear-and-simple-design One pending set owns capture cancellation and one failure value rejects later requests against the failed transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual transport failure signals rather than a document-specific deadline or retry.
 * @evidence contracts/common.md#meaningful-documentation States queue ownership, explicit failure and the absence of a restart policy.
 */
export function createHumanViewerCaptureLifetime() {
  const pending = new Set<(error: Error) => void>();
  let failure: Error | null = null;
  return {
    run: async <Value>(operation: () => Promise<Value>): Promise<Value> => {
      if (failure !== null) throw failure;
      return new Promise<Value>((resolve, reject) => {
        pending.add(reject);
        void Promise.resolve().then(() => {
          if (failure !== null) throw failure;
          return operation();
        }).then((value) => {
          pending.delete(reject);
          resolve(value);
        }).catch((error: unknown) => {
          pending.delete(reject);
          reject(error);
        });
      });
    },
    fail: (error: Error): void => {
      failure = error;
      for (const reject of pending) reject(error);
      pending.clear();
    },
  };
}
