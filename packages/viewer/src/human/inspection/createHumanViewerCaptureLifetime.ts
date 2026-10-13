/**
 * Correlate captures with the browser transport that can complete them.
 * Only an owned renderer's physical settlement releases outstanding captures.
 * Transport loss refuses new dispatch but cannot prove an active renderer gone.
 * This owner supplies no elapsed-time policy and never restarts a process;
 * after a physically settled failure the host may renew it for a replacement
 * page.
 */
export function createHumanViewerCaptureLifetime() {
  const pending = new Set<(error: Error) => void>();
  let failure: Error | null = null;
  let settled = false;
  return {
    run: async <Value>(operation: () => Promise<Value>): Promise<Value> => {
      if (failure !== null) throw failure;
      return new Promise<Value>((resolve, reject) => {
        let dispatched = false;
        pending.add(reject);
        void Promise.resolve()
          .then(() => {
            if (failure !== null) throw failure;
            dispatched = true;
            return operation();
          })
          .then((value) => {
            pending.delete(reject);
            if (failure !== null) reject(failure);
            else resolve(value);
          })
          .catch((error: unknown) => {
            // A disconnected transport can reject while its renderer still runs.
            if (dispatched && failure !== null && !settled) return;
            pending.delete(reject);
            reject(error);
          });
      });
    },
    fail: (error: Error, physicalSettled = true): void => {
      failure = error;
      if (!physicalSettled) return;
      settled = true;
      for (const reject of pending) reject(error);
      pending.clear();
    },
    /**
     * Accept work again for a replacement page. Only a failure whose renderer
     * physically stopped can be renewed, since every capture of the failed
     * page has then been released.
     */
    renew: (): void => {
      if (failure === null) return;
      if (!settled)
        throw new Error(
          "The failed renderer has not stopped; its captures are still held",
        );
      failure = null;
      settled = false;
    },
  };
}
