import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/**
 * This page's ordered mutations, actual-draw waiters and terminal load ownership.
 *
 * HTTP serialization does not cover sidebar, orbit or download events. Those callers share
 * this tail with the first ready operation. A rejected job keeps its original cause while
 * the tail admits the next job. Closing rejects draw waiters and future work; an already
 * running loader must still settle, after which adopt retires its unused texture owner.
 *
 * @evidence contracts/common.md#principled-implementation Serializes real page operations, snapshots apply inputs at admission and only settles draw waiters when the renderer calls drawn; closed pages cannot adopt a late subject.
 * @evidence contracts/common.md#clear-and-simple-design One page-owned helper coordinates existing UI/automation operations; it creates no renderer, subject producer, server queue or new viewing mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No foreign method is replaced and no draw or completed subject is fabricated; job and retirement failures propagate.
 * @evidence contracts/common.md#meaningful-documentation States failure recovery, draw versus scheduling, terminal closure and the unresolved-loader limit.
 * @evidence contracts/performance.md#efficient-algorithms Adds constant promise coordination per job, O(P) copying for P apply-option fields and O(W) work to settle W current draw waiters.
 * @evidence contracts/performance.md#reuse-equivalent-work One actual draw serves every waiter registered before it; ordered jobs still perform their own requested work without merging distinct inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one tail and O(QP+W) queued-input/waiter state for Q pending UI operations. Settlement releases those closures; close drains waiters but cannot cancel an underlying loader. Late texture retirement uses its real owner and does not certify physical GPU release.
 */
export class HumanDebugPageWork {
  /** Settlement of all earlier page jobs; recovered rejection preserves admission of later work. */
  private tail: Promise<void> = Promise.resolve();
  /** Terminal pagehide boundary, set before renderer retirement and never cleared. */
  private stopped: boolean = false;
  /** Only requests waiting for an actual draw; drawn resolves them and close rejects them. */
  private readonly waiters: { resolve(): void; reject(error: Error): void }[] = [];

  /**
   * Record the page's orbit-input boundary; true disables pointer movement during controlled work.
   *
   * Construction retains this callback and empty page-local bookkeeping without starting work.
   * Renderer and subject creation remain with mount, and separate pages have separate lifetimes.
   */
  public constructor(private readonly busy: (active: boolean) => void) {}

  /**
   * Whether pagehide has ended this page's ownership; this flag never reopens.
   *
   * Reads the admission/continuation guard's terminal bit without acquiring resources.
   * It does not mean an in-flight job has settled or physical renderer resources have released.
   */
  public get closed(): boolean {
    return this.stopped;
  }

  /**
   * Reject a continuation before it touches a retired page or renderer.
   *
   * @evidence contracts/common.md#principled-implementation Throws the page-closed cause when the terminal bit is set.
   * @evidence contracts/common.md#clear-and-simple-design Callers guard their existing post-await effects with this one state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A closed continuation is not relabeled as completed work.
   * @evidence contracts/common.md#meaningful-documentation States the guard's terminal effect boundary.
   * @evidence contracts/performance.md#efficient-algorithms Constant-time check and optional error construction.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No repeated producer work is coordinated.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No state or handle is acquired.
   */
  public checkOpen(): void {
    if (this.stopped) throw new Error("Human debug page closed");
  }

  /**
   * Enqueue one existing page operation and preserve its own completion/failure.
   *
   * @evidence contracts/common.md#principled-implementation Starts each job after the preceding settlement, disables orbit input until that operation settles and refuses a closed continuation; jobs requiring a draw wait for drawn explicitly.
   * @evidence contracts/common.md#clear-and-simple-design The swallowed tail rejection only recovers ordering; the caller retains the original rejecting task.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Runs no rejected or closed job as a success and retries no producer.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes per-caller outcome from the recovered tail.
   * @evidence contracts/performance.md#efficient-algorithms Constant promise bookkeeping per job, excluding the requested operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct requested mutations are deliberately not shared.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains each pending callback until its turn settles; a job that never settles still blocks its tail and is not cancelled by close.
   */
  public run<T>(job: () => Promise<T>): Promise<T> {
    if (this.stopped) return Promise.reject(new Error("Human debug page closed"));
    const task: Promise<T> = this.tail.then(async (): Promise<T> => {
      this.checkOpen();
      this.busy(true);
      try {
        const value: T = await job();
        this.checkOpen();
        return value;
      } finally {
        this.busy(this.stopped);
      }
    });
    this.tail = task.then((): void => {}).catch((): void => {});
    return task;
  }

  /**
   * Queue an apply with its own options and notice arrays, copied before any wait.
   *
   * @evidence contracts/common.md#principled-implementation structuredClone preserves this typed plain option record, including nested lists, before a caller can change it.
   * @evidence contracts/common.md#clear-and-simple-design The actual page apply remains the producer; this boundary owns admission copies and ordering only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reparse, normalize or substitute requested values and adds no test-only producer path.
   * @evidence contracts/common.md#meaningful-documentation Names admission-time ownership of options and notices.
   * @evidence contracts/performance.md#efficient-algorithms Copies O(P) typed option data once per request.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct apply requests keep distinct owned records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The copied record is retained only by its queued/running operation and resulting live page state.
   */
  public apply<T>(next: IHumanDebugOptions, messages: readonly string[], update: (next: IHumanDebugOptions, messages: string[]) => Promise<T>): Promise<T> {
    const options: IHumanDebugOptions = structuredClone(next);
    const notices: string[] = [...messages];
    return this.run((): Promise<T> => update(options, notices));
  }

  /**
   * Transfer a loaded subject synchronously while open, or retire its unused textures.
   *
   * @evidence contracts/common.md#principled-implementation Checks closure after the real load and before the synchronous view-ownership transfer; a late or rejected transfer retires the actual subject cache with its primary cause.
   * @evidence contracts/common.md#clear-and-simple-design The page constructs its view in receive; no GPU object is constructed here or after a closed admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves loader/transfer failures and ordered cleanup causes through the existing retirement owner.
   * @evidence contracts/common.md#meaningful-documentation Defines the atomic ownership transfer and eventual-loader requirement.
   * @evidence contracts/performance.md#efficient-algorithms Constant coordination around the existing load and optional texture retirement.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every returned subject has its own explicit transfer or retirement.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A closed page keeps no late subject; cache disposal must settle independently and public completion does not prove physical GPU release.
   */
  public async adopt<T>(pending: Promise<IHumanDebugSubject>, receive: (subject: IHumanDebugSubject) => T): Promise<T> {
    const subject: IHumanDebugSubject = await pending;
    try {
      this.checkOpen();
      return receive(subject);
    } catch (error: unknown) {
      return createAutoMovieResourceRetirement([async (): Promise<void> => { await subject.textures?.dispose(); }], { error })();
    }
  }

  /**
   * Register a waiter for the next actual renderer completion, never a scheduling receipt.
   *
   * @evidence contracts/common.md#principled-implementation Every caller receives its own waiter; a closed page rejects instead of waiting on a stopped renderer.
   * @evidence contracts/common.md#clear-and-simple-design The caller marks its draw dirty; drawn alone signals completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Schedules no substitute frame or timeout success.
   * @evidence contracts/common.md#meaningful-documentation Separates draw completion from scheduling.
   * @evidence contracts/performance.md#efficient-algorithms Amortized constant-time waiter append.
   * @evidence contracts/performance.md#reuse-equivalent-work All pre-draw waiters can observe the same actual draw.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one resolve/reject pair until drawn or close drains it.
   */
  public nextFrame(): Promise<void> {
    if (this.stopped) return Promise.reject(new Error("Human debug page closed"));
    return new Promise<undefined>((resolve: (value: undefined) => void, reject: (error: Error) => void): void => {
      this.waiters.push({ resolve: (): void => resolve(undefined), reject });
    });
  }

  /**
   * Settle all current waiters after the caller's draw; later waiters need a later draw.
   *
   * @evidence contracts/common.md#principled-implementation Drains the current list before resolving it, so later continuations register for a later completion.
   * @evidence contracts/common.md#clear-and-simple-design Called at the actual page renderer's draw boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This signal itself claims no independent pixel or GPU verification.
   * @evidence contracts/common.md#meaningful-documentation States current-versus-future waiter ownership.
   * @evidence contracts/performance.md#efficient-algorithms O(W) operations for W current waiters.
   * @evidence contracts/performance.md#reuse-equivalent-work Resolves one completion to every existing observer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Removes every completed waiter reference from the page list.
   */
  public drawn(): void {
    for (const waiter of this.waiters.splice(0)) waiter.resolve();
  }

  /**
   * Close before renderer retirement; queued work and every draw waiter must stop.
   *
   * @evidence contracts/common.md#principled-implementation Sets the terminal bit before input disable and draw-wait rejection; queued callbacks refuse on entry and running continuations remain guarded.
   * @evidence contracts/common.md#clear-and-simple-design Physical retirement remains with mount and each late subject's texture owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not cancel or declare a pending loader settled, and does not reopen after an error.
   * @evidence contracts/common.md#meaningful-documentation States close ordering and the eventual-loader limit.
   * @evidence contracts/performance.md#efficient-algorithms O(W) rejection of current draw waiters; repeated close is constant-time.
   * @evidence contracts/performance.md#reuse-equivalent-work One terminal state serves every later guard.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears all draw waiters. A queued task behind a pending producer still awaits that producer's settlement before its closed-entry rejection.
   */
  public close(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.busy(true);
    const error: Error = new Error("Human debug page closed");
    for (const waiter of this.waiters.splice(0)) waiter.reject(error);
  }
}
