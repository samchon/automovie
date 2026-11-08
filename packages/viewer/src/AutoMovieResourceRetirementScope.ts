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
 * @evidence contracts/development/design.md#principled-representation Resource identity owns one closing function, while closing-function identity owns one observed attempt; successful outcomes are removed and rejected outcomes retain their original causes so uncertain retirement cannot become permission to allocate again.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Open admission, resource registration, attempt tracking and settlement separate allocation ownership from asynchronous completion without introducing a global resource manager.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed attempts are not retried or declared successful; closing the logical scope never authorizes replacing a borrowed GPU context.
 * @evidence contracts/development/common.md#meaningful-documentation Explains pending and failed retention, concurrent registrations during settlement, non-retry behavior and preview allocation admission.
 */
export class AutoMovieResourceRetirementScope {
  private closed: boolean = false;
  private closing: Promise<void> | undefined;
  private readonly owned: Map<object, () => Promise<void>> = new Map<
    object,
    () => Promise<void>
  >();
  private readonly entries: Map<
    () => Promise<void>,
    Promise<{ success: true } | { success: false; error: unknown }>
  > = new Map<
    () => Promise<void>,
    Promise<{ success: true } | { success: false; error: unknown }>
  >();

  /**
   * Refuse preparation or publication after this resource owner was closed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A monotonic closed flag rejects allocation or publication after close begins, including while asynchronous retirement remains pending.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission check serves both direct owners and the ready preparation barrier.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Closed ownership is never reopened after a cleanup failure or selected consumer request.
   * @evidence contracts/development/common.md#meaningful-documentation States which preparation/publication lifecycle state causes refusal.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A single flag check chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Admission observes current lifecycle state and coordinates no reusable result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This guard acquires no handle and adds no retained ownership record.
   */
  public requireOpen(): void {
    if (this.closed) throw new Error("This resource owner has been closed.");
  }

  /**
   * Admit new allocation only after prior retirement succeeded and ownership is open.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Checks openness before and after awaiting settlement and repeats while entries remain, preventing a close or newly tracked retirement during suspension from admitting replacement allocation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ready is the allocation barrier while settle owns outcome draining and requireOpen owns lifecycle refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejected retirement propagates instead of being interpreted as permission to replace uncertain resources.
   * @evidence contracts/development/common.md#meaningful-documentation States both prerequisites for admission: successful prior retirement and currently open ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs settlement rounds only while retained attempts remain; work follows the registered attempt population and can remain pending if owners keep adding work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Settlement awaits existing tracked promises and never invokes a second closer merely because another ready caller arrives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readiness promise owns only its wait; attempt records remain scope-owned and failures or nonsettling closers keep allocation refused or pending.
   */
  public async ready(): Promise<void> {
    this.requireOpen();
    do {
      await this.settle();
    } while (this.entries.size !== 0);
    this.requireOpen();
  }

  /**
   * Register a resource before asynchronous preparation can be interrupted.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Admits one closing function per resource object only while open, refusing duplicate ownership before any asynchronous preparation can escape registration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Stores identity and its closer together; release and close consume the same ownership map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Duplicate resources throw rather than overwriting the original closer and losing its retirement responsibility.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies registration before interruptible asynchronous preparation so callers preserve cleanup ownership.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Identity lookup and insertion require no scan of other owned resources.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Resource registration establishes effects and ownership rather than sharing a computed value.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one resource and closer until release or scope close; the number of registered resources has no independent numeric bound.
   */
  public own(resource: object, retire: () => Promise<void>): void {
    this.requireOpen();
    if (this.owned.has(resource))
      throw new Error("This resource already has a retirement owner.");
    this.owned.set(resource, retire);
  }

  /**
   * Withdraw one registered resource; repeat requests do not repeat retirement.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Removes the resource ownership entry before tracking its closer, making reentrant or repeated release observe absence while asynchronous retirement stays owned by entries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Transfers one closer from the ownership map to the attempt tracker without mixing native resource APIs into the scope.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown resource identity is an idempotent no-op; no substitute closer or inferred successful cleanup is recorded.
   * @evidence contracts/development/common.md#meaningful-documentation States withdrawal and the repeated-release guarantee needed by interrupted preparation and final teardown.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One resource lookup, deletion and attempt registration choose no collection-wide algorithm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Deleting before track ensures repeated resource release does not invoke its closer again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The resource leaves owned immediately, while its closing function remains in entries until successful settlement or indefinitely after failure.
   */
  public release(resource: object): void {
    const retire: (() => Promise<void>) | undefined = this.owned.get(resource);
    if (retire !== undefined) {
      this.owned.delete(resource);
      this.track(retire);
    }
  }

  /**
   * Observe an idempotent retirement once while pending or failed. Successful
   * entries are removed; the supplied operation owns memoization if a caller
   * registers that completed operation again.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Schedules the closer through a promise boundary so synchronous throws become observed failure outcomes; the rejection handler attaches immediately and preserves the cause without retry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One Map entry pairs closing-function identity with a discriminated success/failure promise used by every settlement caller.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failure outcome is recorded as failure rather than swallowed by a rejection observer that reports successful retirement.
   * @evidence contracts/development/common.md#meaningful-documentation Describes pending/failed deduplication, successful removal and the supplied operation's responsibility for completed-call memoization.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Map membership and one promise chain are constant-size bookkeeping around the caller-owned retirement operation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same closing function shares its pending or failed promise; a successful removed function may be registered again because effect memoization belongs to that function.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps the closer and outcome until successful settlement; rejection remains strongly retained so later callers cannot lose the original uncertainty.
   */
  public track(retire: () => Promise<void>): void {
    if (this.entries.has(retire)) return;
    const outcome: Promise<
      { success: true } | { success: false; error: unknown }
    > = Promise.resolve()
      .then(retire)
      .then((): { success: true } => ({ success: true }))
      .catch((error: unknown): { success: false; error: unknown } => ({
        success: false,
        error,
      }));
    this.entries.set(retire, outcome);
  }

  /**
   * Await all actual attempts, preserving failed entries for every later caller.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Observes each tracked closer once per settlement call, awaits its discriminated outcome and rescans for registrations added during suspension; successful entries are deleted and original failures are reported through the shared retirement aggregator.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A local observed Set distinguishes work already awaited by this caller from scope-wide retained attempts, allowing concurrent settlement without native retries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failed entries stay visible to later settlement calls; logical completion cannot discard a physical-retirement cause.
   * @evidence contracts/development/common.md#meaningful-documentation States that all actual attempts are awaited and failures remain available for every later caller.
   * @evidence contracts/development/implementation.md#efficient-algorithms Batches unobserved outcomes with Promise.all, using linear local bookkeeping; each rescan visits retained entries, so many staggered registration rounds can cause quadratic bookkeeping in attempt count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Settlement shares promises already created by track and observes effects without invoking any closer a second time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful attempts are removed after observation; failed closer/outcome pairs remain scope-owned without a numeric bound, and perpetual registration or nonsettling tasks can delay completion indefinitely.
   */
  public async settle(): Promise<void> {
    const failures: unknown[] = [];
    const observed: Set<() => Promise<void>> = new Set<() => Promise<void>>();
    while (true) {
      const next: [
        () => Promise<void>,
        Promise<{ success: true } | { success: false; error: unknown }>,
      ][] = [...this.entries].filter(
        ([retire]: [
          () => Promise<void>,
          Promise<{ success: true } | { success: false; error: unknown }>,
        ]): boolean => !observed.has(retire),
      );
      if (next.length === 0) break;
      const outcomes: (
        | { success: true }
        | { success: false; error: unknown }
      )[] = await Promise.all(
        next.map(
          ([, outcome]: [
            () => Promise<void>,
            Promise<{ success: true } | { success: false; error: unknown }>,
          ]): Promise<{ success: true } | { success: false; error: unknown }> =>
            outcome,
        ),
      );
      for (const [index, [retire]] of next.entries()) {
        observed.add(retire);
        const outcome: { success: true } | { success: false; error: unknown } =
          outcomes[index]!;
        if (outcome.success) this.entries.delete(retire);
        else failures.push(outcome.error);
      }
    }
    reportAutoMovieResourceRetirement(
      failures.map((error: unknown): (() => never) => (): never => {
        throw error;
      }),
    );
  }

  /**
   * Close all owned resources, including pending preparation, with one completion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Marks ownership closed before releasing every registered resource and stores the settlement promise, so preparation admission fails immediately and every close caller receives the same outcome.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Close coordinates existing release and settle operations rather than maintaining a separate teardown path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejected completion is memoized with the original causes and never replaced with a successful retry result.
   * @evidence contracts/development/common.md#meaningful-documentation Describes complete scope teardown, pending preparation ownership and the shared completion contract.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits each registered resource once before settling tracked attempts; repeated close calls return in constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A single closing promise shares teardown effects and failure identity across concurrent and repeated close callers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Drains owned resources into tracked retirement before awaiting completion; successful entries leave the scope while failed entries and the rejected close promise preserve uncertain lifetime.
   */
  public close(): Promise<void> {
    if (this.closing === undefined) {
      this.closed = true;
      for (const resource of this.owned.keys()) this.release(resource);
      this.closing = this.settle();
    }
    return this.closing;
  }
}
