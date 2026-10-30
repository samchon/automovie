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

  /** Acquire lazily; a closing or failed-close owner rejects new work. */
  public get(): HumanImageSession {
    if (this.closing !== undefined)
      throw new Error("Human image session is closing");
    return (this.session ??= new HumanImageSession(this.server, this.root));
  }

  /** Report HTTP admission state without starting a process or session. */
  public status(): { pending: number; closing: boolean } {
    return {
      pending: this.session?.pending() ?? 0,
      closing: this.closing !== undefined,
    };
  }

  /** Join actual Session.close; failure retains the owner and rejected promise. */
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
