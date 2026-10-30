import type { ViteDevServer } from "vite";

import { HumanImageSession } from "./HumanImageSession";

/** Own one lazy HTTP session and its shared normal close operation.
 *
 * @evidence contracts/common.md#principled-implementation Acquisition uses the existing Session; closing shares Session.close and blocks new admission until its successful completion.
 * @evidence contracts/common.md#clear-and-simple-design Keeps HTTP lifecycle ownership separate from page-specific model routes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Busy cancellation is the actual Session.close, never idle release or PID-only termination; failure retains ownership.
 * @evidence contracts/common.md#meaningful-documentation Successful close invalidates the caller's current model and permits a new lazy session.
 * @evidence contracts/performance.md#efficient-algorithms Constant bookkeeping delegates native cleanup to the existing owner.
 * @evidence contracts/performance.md#reuse-equivalent-work One session and in-flight close serve concurrent requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one Session and close promise survive; success drops both and failure preserves uncertainty.
 */
export class HumanImageSessionOwner {
  /** Existing Vite owner and repository scope, borrowed for lazy acquisition. */
  private readonly server: ViteDevServer;
  private readonly root: string;
  /** Clear the HTTP current-model binding only after successful cleanup. */
  private readonly onClosed: () => void;
  /** Current native owner, retained on cleanup failure. */
  private session: HumanImageSession | undefined;
  private closing: Promise<void> | undefined;

  /** Borrow the server/root and invalidation callback for this middleware's lifetime. */
  public constructor(
    server: ViteDevServer,
    root: string,
    onClosed: () => void,
  ) {
    this.server = server;
    this.root = root;
    this.onClosed = onClosed;
  }

  /** Acquire lazily; a closing or failed-close owner rejects new work.
   *
   * @evidence contracts/common.md#principled-implementation Refuses acquisition while a close promise exists and otherwise creates the existing Session only when absent.
   * @evidence contracts/common.md#clear-and-simple-design One nullable Session owns admission; native startup remains lazy inside that Session.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed close does not silently abandon an uncertain owner or start a replacement.
   * @evidence contracts/common.md#meaningful-documentation States lazy acquisition and refusal throughout closing, including rejected close.
   * @evidence contracts/performance.md#efficient-algorithms Constant field checks avoid source scans or process startup on this boundary.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the same Session until successful close invalidates it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains at most one Session; its successful close releases that reference.
   */
  public get(): HumanImageSession {
    if (this.closing !== undefined)
      throw new Error("Human image session is closing");
    return (this.session ??= new HumanImageSession(this.server, this.root));
  }

  /** Report HTTP admission state without starting a process or session.
   *
   * @evidence contracts/common.md#principled-implementation Reports the existing Session's admitted count or zero and the actual close-promise presence.
   * @evidence contracts/common.md#clear-and-simple-design A detached scalar record exposes status without granting access to the owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero pending does not certify native cleanup, and closing remains true after failure.
   * @evidence contracts/common.md#meaningful-documentation States that observation has no session or process acquisition effect.
   * @evidence contracts/performance.md#efficient-algorithms Constant reads allocate only the two-field result.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads maintained admission state instead of enumerating requests or processes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns numbers/booleans without transferring handles or retaining a status history.
   */
  public status(): { pending: number; closing: boolean } {
    return {
      pending: this.session?.pending() ?? 0,
      closing: this.closing !== undefined,
    };
  }

  /** Join actual Session.close; failure retains the owner and rejected promise.
   *
   * @evidence contracts/common.md#principled-implementation Awaits the captured Session close before invalidating HTTP state and dropping owner references.
   * @evidence contracts/common.md#clear-and-simple-design A single shared promise serializes close and blocks get until successful completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Session or invalidation-callback failure remains rejected; no uncertain owner is replaced.
   * @evidence contracts/common.md#meaningful-documentation States successful release versus sticky failed-close ownership.
   * @evidence contracts/performance.md#efficient-algorithms Constant orchestration delegates queue and native retirement cost to the existing Session.
   * @evidence contracts/performance.md#reuse-equivalent-work Concurrent and repeated calls share the same in-flight or rejected close promise.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Success releases Session and promise references; failure retains both for diagnosis without retrying cleanup.
   */
  public close(): Promise<void> {
    if (this.closing !== undefined) return this.closing;
    const owned: HumanImageSession | undefined = this.session;
    this.closing = Promise.resolve().then(async (): Promise<void> => {
      await owned?.close();
      this.onClosed();
      this.session = undefined;
      this.closing = undefined;
    });
    return this.closing;
  }
}
