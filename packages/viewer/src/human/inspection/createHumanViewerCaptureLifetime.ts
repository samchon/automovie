/**
 * Gate capture dispatch using the host's reported renderer-lifetime settlement. Transport-only failure blocks new work and holds uncertain dispatched rejections; an accepted host settlement signal releases them and permits renewal. This tracker observes no OS/GPU kernel termination itself, so the caller owns the evidence and limits of that signal. It adds no timeout or process restart policy.
 *
 * @evidence contracts/common.md#principled-implementation Dispatch promises are tied to the host-reported lifetime; transport-only failure blocks new work and holds uncertain rejections until the host supplies settlement, without independently observing OS/GPU termination.
 * @evidence contracts/common.md#clear-and-simple-design One failure state, settlement flag and pending-reject Set separate transport uncertainty from host-owned renderer replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timeout or abort race changes the settlement flag; renewal refuses until the host reports settlement, whose native proof and public-boundary limitations remain the host's responsibility.
 * @evidence contracts/common.md#meaningful-documentation The prose explains transport-only failure, host-reported settlement and its independent native-observation limit, lack of elapsed-time policy and renewal prerequisite.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch/normal completion use Set insertion/deletion; a host-reported settled failure visits each pending request once in O(P) time and O(P) retained callbacks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each dispatch owns distinct renderer effects; this lifetime tracker shares no capture results across equal operation inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending callbacks leave on operation completion or accepted host settlement; transport-only uncertainty can retain them indefinitely, with no independent numeric request cap or OS/GPU termination measurement in this owner.
 */
export function createHumanViewerCaptureLifetime(): {
  run: <Value>(operation: () => Promise<Value>) => Promise<Value>;
  fail: (error: Error, physicalSettled?: boolean) => void;
  renew: () => void;
} {
  const pending: Set<(error: Error) => void> = new Set<(error: Error) => void>();
  let failure: Error | null = null;
  let settled: boolean = false;
  return {
    run: async <Value>(operation: () => Promise<Value>): Promise<Value> => {
      if (failure !== null) throw failure;
      return new Promise<Value>((resolve: (value: Value | PromiseLike<Value>) => void, reject: (reason?: unknown) => void): void => {
        let dispatched: boolean = false;
        pending.add(reject);
        void Promise.resolve()
          .then((): Promise<Value> => {
            if (failure !== null) throw failure;
            dispatched = true;
            return operation();
          })
          .then((value: Value): void => {
            pending.delete(reject);
            if (failure !== null) reject(failure);
            else resolve(value);
          })
          .catch((error: unknown): void => {
            // A disconnected transport can reject while its renderer still runs.
            if (dispatched && failure !== null && !settled) return;
            pending.delete(reject);
            reject(error);
          });
      });
    },
    fail: (error: Error, physicalSettled: boolean = true): void => {
      failure = error;
      if (!physicalSettled) return;
      settled = true;
      for (const reject of pending) reject(error);
      pending.clear();
    },
    /**
     * Accept replacement dispatch only after the host reports settlement and this tracker has released every failed-lifetime callback. The flag itself is not an OS/GPU measurement.
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
