import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Retain the actual pending and failed retirements of one resource owner.
 * Successful attempts leave the scope; failed attempts retain both the original
 * cause and their resource-closing function, keeping uncertain ownership alive.
 * Requests made while settlement is pending are included before it can finish.
 *
 * Tracking observes rejection immediately, without declaring it successful or
 * issuing a second attempt. Settlement reports the stored causes; it neither
 * retries failed physical retirement nor authorizes replacing a borrowed GPU
 * context. Preview preparation uses it before allocating another cache.
 *
 * @evidence contracts/common.md#principled-implementation Pending and failed records retain actual release functions and causes until successful retirement; admission and close enforce one owned lifetime.
 * @evidence contracts/common.md#clear-and-simple-design One scope owns allocation admission, withdrawal and failed-retirement retention for both preview renderers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure remains explicit instead of retrying unknown native releases, guessing allocation state or ending borrowed contexts.
 * @evidence contracts/common.md#meaningful-documentation States registration timing, settlement, sticky failure and the physical lifetime boundary.
 */
export class AutoMovieResourceRetirementScope {
  private closed = false;
  private closing: Promise<void> | undefined;
  private readonly owned = new Map<object, () => Promise<void>>();
  private readonly entries = new Map<
    () => Promise<void>,
    Promise<{ success: true } | { success: false; error: unknown }>
  >();

  /** Refuse preparation or publication after this resource owner was closed. */
  public requireOpen(): void {
    if (this.closed) throw new Error("This resource owner has been closed.");
  }

  /** Admit new allocation only after prior retirement succeeded and ownership is open. */
  public async ready(): Promise<void> {
    this.requireOpen();
    do {
      await this.settle();
    } while (this.entries.size !== 0);
    this.requireOpen();
  }

  /** Register a resource before asynchronous preparation can be interrupted. */
  public own(resource: object, retire: () => Promise<void>): void {
    this.requireOpen();
    if (this.owned.has(resource))
      throw new Error("This resource already has a retirement owner.");
    this.owned.set(resource, retire);
  }

  /** Withdraw one registered resource; repeat requests do not repeat retirement. */
  public release(resource: object): void {
    const retire = this.owned.get(resource);
    if (retire !== undefined) {
      this.owned.delete(resource);
      this.track(retire);
    }
  }

  /**
   * Observe an idempotent retirement once while pending or failed. Successful
   * entries are removed; the supplied operation owns memoization if a caller
   * registers that completed operation again.
   */
  public track(retire: () => Promise<void>): void {
    if (this.entries.has(retire)) return;
    const outcome = Promise.resolve().then(retire)
      .then(() => ({ success: true as const }))
      .catch((error: unknown) => ({ success: false as const, error }));
    this.entries.set(retire, outcome);
  }

  /** Await all actual attempts, preserving failed entries for every later caller. */
  public async settle(): Promise<void> {
    const failures: unknown[] = [];
    const observed = new Set<() => Promise<void>>();
    while (true) {
      const next = [...this.entries].filter(([retire]) => !observed.has(retire));
      if (next.length === 0) break;
      const outcomes = await Promise.all(next.map(([, outcome]) => outcome));
      for (const [index, [retire]] of next.entries()) {
        observed.add(retire);
        const outcome = outcomes[index]!;
        if (outcome.success) this.entries.delete(retire);
        else failures.push(outcome.error);
      }
    }
    reportAutoMovieResourceRetirement(
      failures.map((error) => () => {
        throw error;
      }),
    );
  }

  /** Close all owned resources, including pending preparation, with one completion. */
  public close(): Promise<void> {
    if (this.closing === undefined) {
      this.closed = true;
      for (const resource of this.owned.keys()) this.release(resource);
      this.closing = this.settle();
    }
    return this.closing;
  }
}
