import type { CDPSession } from "playwright-core";

/**
 * One borrowed-page CDP lease, including acquisition that finishes after cancellation.
 * Cancellation interrupts waits, not the browser's transport; cleanup is bounded best effort.
 *
 * @evidence contracts/common.md#principled-implementation Owns one CDP acquisition and retires it even when it arrives after the operation has ended.
 * @evidence contracts/common.md#clear-and-simple-design The monitor owns observation policy; this lease owns cancellation, cancellable delays and session retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fake browser completion or swallow the caller's primary result; transport cleanup failures cannot replace it.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes cancellation from transport interruption and bounded cleanup requests from confirmed browser release.
 * @evidence contracts/performance.md#efficient-algorithms Constant state per probe and per active wait; cleanup issues at most three protocol operations.
 * @evidence contracts/performance.md#reuse-equivalent-work All reads use the same acquisition; retirement is idempotent and late arrivals do not acquire another session.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Close aborts waits and releases their timers/listeners; acquired and late sessions receive bounded cleanup, with no global retained population.
 */
export class HumanDebugCaptureProbe {
  /** Stops every owned wait when its operation ends. */
  private readonly cancellation: AbortController = new AbortController();
  /** The one acquisition, observed from construction even when it rejects late. */
  private readonly opened: Promise<CDPSession>;
  /** Session that has actually arrived, if any. */
  private acquired: CDPSession | undefined;
  /** One retirement shared by explicit close and late arrival. */
  private retired: Promise<void> | undefined;

  /**
   * Begin one normal CDP acquisition without delaying observation of the caller's work.
   *
   * Observes both acquisition outcomes immediately; an already cancelled lease retires any late session.
   * The factory is the browser boundary and grace is the existing cleanup allowance in milliseconds.
   * Calls the actual factory once, without replacement transports or a success fallback.
   * debuggerOwned requests resume/disable before detach; deadline is an optional absolute Date.now boundary.
   * One promise and one pair of settlement handlers, independent of frame/mesh size.
   * Reuses this acquisition for every operation of the probe.
   * A late arrival starts bounded retirement without blocking the completed caller; rejected acquisition creates no session to release.
   */
  public constructor(
    open: () => Promise<CDPSession>,
    private readonly grace: number,
    private readonly debuggerOwned: boolean = false,
    private readonly deadline?: number,
  ) {
    try { this.opened = open(); } catch (error) { this.opened = Promise.reject(error); }
    void this.opened.then((session: CDPSession): void => {
      this.acquired = session;
      if (this.cancellation.signal.aborted) void this.retire(session);
    }).catch((): void => {});
  }

  /**
   * Use the acquired session only while the lease is active.
   *
   * @evidence contracts/common.md#principled-implementation Checks cancellation after acquisition and races both acquisition and work against cancellation.
   * @evidence contracts/common.md#clear-and-simple-design One callback gives the monitor the original typed CDP session.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancelled late acquisition never starts a new browser command.
   * @evidence contracts/common.md#meaningful-documentation Cancellation rejects the wait with an internal Error; it does not abort an already sent protocol command.
   * @evidence contracts/performance.md#efficient-algorithms Constant promise/listener work per call.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the constructor's one session promise.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The wait removes its abort listener on every outcome; close owns session retirement.
   */
  public call<T>(operation: (session: CDPSession) => Promise<T>): Promise<T> {
    return this.wait(this.opened.then((session: CDPSession): Promise<T> => {
      if (this.cancellation.signal.aborted) throw new Error("Human debug probe cancelled");
      return operation(session);
    }));
  }

  /**
   * Observe a promise immediately and stop waiting when the probe closes.
   *
   * @evidence contracts/common.md#principled-implementation Attaches settlement observers even when cancellation has already happened.
   * @evidence contracts/common.md#clear-and-simple-design The same cancellation seam is used for setup, protocol work and delayed readings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the pending promise's exact resolved or thrown value when it wins.
   * @evidence contracts/common.md#meaningful-documentation Only the wait is cancelled; a late underlying outcome remains observed.
   * @evidence contracts/performance.md#efficient-algorithms One temporary listener and promise per active wait.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the probe's cancellation signal.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Settlement or cancellation removes the listener; late rejection is consumed by the attached observer.
   */
  public wait<T>(pending: Promise<T>): Promise<T> {
    return new Promise<T>((resolve: (value: T) => void, reject: (reason?: unknown) => void): void => {
      const signal: AbortSignal = this.cancellation.signal;
      const stopped: () => void = (): void => {
        signal.removeEventListener("abort", stopped);
        reject(new Error("Human debug probe cancelled"));
      };
      pending.then((value: T): void => {
        signal.removeEventListener("abort", stopped);
        resolve(value);
      }).catch((error: unknown): void => {
        signal.removeEventListener("abort", stopped);
        reject(error);
      });
      if (signal.aborted) stopped();
      else signal.addEventListener("abort", stopped, { once: true });
    });
  }

  /**
   * A delay owned by this probe, cleared on completion or cancellation.
   *
   * @evidence contracts/common.md#principled-implementation Couples the timeout handle to the same cancellation lifetime as protocol reads.
   * @evidence contracts/common.md#clear-and-simple-design Used for sample cadence and the trace deadline.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not change a production duration or treat cancellation as completed work.
   * @evidence contracts/common.md#meaningful-documentation The duration is milliseconds; a cancelled delay rejects.
   * @evidence contracts/performance.md#efficient-algorithms One timeout handle per active delay.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing lease signal without a second controller.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Finally clears the timer for success, failure and cancellation.
   */
  public delay(milliseconds: number): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const elapsed: Promise<undefined> = new Promise<undefined>((resolve: (value: undefined) => void): void => { timer = setTimeout(resolve, milliseconds, undefined); });
    return this.wait(elapsed).finally((): void => { clearTimeout(timer); });
  }

  /**
   * Stop pending reads; session retirement is performed by close.
   *
   * @evidence contracts/common.md#principled-implementation One signal cancels every outstanding lease wait.
   * @evidence contracts/common.md#clear-and-simple-design Separates signalling from asynchronous bounded retirement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim to interrupt the browser transport.
   * @evidence contracts/common.md#meaningful-documentation Idempotent cancellation is safe from the guard's finally and trace deadline.
   * @evidence contracts/performance.md#efficient-algorithms Linear only in the probe's active listeners.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated calls reuse AbortController's settled state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Wakes waits so their finally blocks remove timers and event handlers.
   */
  public cancel(): void {
    this.cancellation.abort();
  }

  /**
   * Cancel waits and retire an arrived session without changing any primary outcome.
   *
   * @evidence contracts/common.md#principled-implementation Late acquisition is handled by the constructor observer; an arrived session is retired once.
   * @evidence contracts/common.md#clear-and-simple-design The monitor always calls close in finally.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup errors are consumed; completion means bounded requests, not proven renderer responsiveness.
   * @evidence contracts/common.md#meaningful-documentation The optional absolute deadline bounds trace cleanup within its existing grace.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and at most one retirement.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the retirement promise across repeated close calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No wait for unresolved acquisition; an acquired session's cleanup wait has a cleared bounded timer.
   */
  public close(): Promise<void> {
    this.cancel();
    return this.acquired === undefined ? Promise.resolve() : this.retire(this.acquired);
  }

  /**
   * Drain observed work only until an absolute cleanup deadline.
   *
   * @evidence contracts/common.md#principled-implementation Consumes settlement without changing the caller's already chosen primary outcome.
   * @evidence contracts/common.md#clear-and-simple-design Lets the guard drain nested cancelled observation using the same bounded wait as session retirement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim to terminate an unresponsive transport or extend the deadline.
   * @evidence contracts/common.md#meaningful-documentation deadline is an absolute Date.now value in milliseconds.
   * @evidence contracts/performance.md#efficient-algorithms Constant promise and timer work.
   * @evidence contracts/performance.md#reuse-equivalent-work Drains the existing operation rather than starting another observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The bounded timer is cleared on either outcome; late rejection stays observed.
   */
  public static settle(pending: Promise<unknown>, deadline: number): Promise<void> {
    return bounded(pending.catch((): void => {}), Math.max(0, deadline - Date.now()));
  }

  /** Issue all cleanup requests even when one throws; wait only within the cleanup boundary. */
  private retire(session: CDPSession): Promise<void> {
    if (this.retired !== undefined) return this.retired;
    const attempt: (operation: () => Promise<unknown>) => Promise<unknown> = (operation: () => Promise<unknown>): Promise<unknown> => {
      try { return operation().catch((): void => {}); } catch { return Promise.resolve(); }
    };
    const requests: Promise<unknown>[] = [];
    if (this.debuggerOwned) {
      requests.push(attempt((): Promise<unknown> => session.send("Debugger.resume")));
      requests.push(attempt((): Promise<unknown> => session.send("Debugger.disable")));
    }
    requests.push(attempt((): Promise<void> => session.detach()));
    const finished: Promise<unknown> = Promise.all(requests);
    const remaining: number = this.deadline === undefined ? this.grace : Math.max(0, this.deadline - Date.now());
    this.retired = bounded(finished, remaining);
    return this.retired;
  }
}

/** Wait at most milliseconds for already observed cleanup; never reject or leave its timer alive. */
async function bounded(pending: Promise<unknown>, milliseconds: number): Promise<void> {
  if (milliseconds <= 0) return;
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([pending, new Promise<undefined>((resolve: (value: undefined) => void): void => { timer = setTimeout(resolve, milliseconds, undefined); })]);
  } finally {
    clearTimeout(timer);
  }
}
