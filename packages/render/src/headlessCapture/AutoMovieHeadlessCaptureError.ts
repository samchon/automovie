import type { AutoMovieHeadlessCaptureErrorCode } from "./AutoMovieHeadlessCaptureErrorCode";

/**
 * Error thrown by createHeadlessCaptureAdapter and captureFrame for their classified navigation, hook, style, screenshot, pass-list and empty-frame failures.
 *
 * `code` names the failed step, `message` names the route, hook, selector,
 * pass or time involved, and `source` keeps the page's original error when the
 * failure came from a guarded page call. Locator construction, caller writeFrame and session close failures propagate unwrapped.
 *
 * @evidence contracts/common.md#principled-implementation A subclass of the built-in `Error` keeps the stack and `instanceof` checks while adding a typed code, and the original page error is kept as data so wrapping loses nothing a caller could inspect.
 * @evidence contracts/common.md#clear-and-simple-design The class adds only the two fields a caller needs, a category to branch on and the wrapped cause, and sets `name` so logs identify the adapter as the thrower.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The class wraps errors without retrying, suppressing or translating them into success, and no page, route or test receives a special message.
 * @evidence contracts/common.md#meaningful-documentation The doc says who throws it, what each of `code`, `message` and `source` carries, and that `writeFrame` failures are deliberately left unwrapped.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The constructor assigns three fields and performs no search, traversal or allocation beyond the error object itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each failure builds its own error for one thrown path, and no two throws describe the same work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains only the wrapped `source` error, released when the caller drops the error; it opens no page, handle or task.
 * @author Samchon
 */
export class AutoMovieHeadlessCaptureError extends Error {
  /** The capture step that failed; see `AutoMovieHeadlessCaptureErrorCode`. */
  public readonly code: AutoMovieHeadlessCaptureErrorCode;

  /**
   * The error the page call threw, or `undefined` when the adapter itself
   * detected the failure, as for an empty pass list or a zero-byte frame.
   */
  public readonly source: unknown;

  /**
   * @param code The capture step that failed.
   * @param message Human-readable description naming the route, hook,
   *   selector, pass or time involved.
   * @param source The page error being wrapped, if any.
   */
  public constructor(
    code: AutoMovieHeadlessCaptureErrorCode,
    message: string,
    source?: unknown,
  ) {
    super(message);
    this.name = "AutoMovieHeadlessCaptureError";
    this.code = code;
    this.source = source;
  }
}
