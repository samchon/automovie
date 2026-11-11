import type { AutoMovieHeadlessCaptureErrorCode } from "./AutoMovieHeadlessCaptureErrorCode.js";

/**
 * Error thrown by createHeadlessCaptureAdapter and captureFrame for their classified page-opening, pass-list and drawing failures.
 *
 * `code` names the failed step, `message` names the page, film, pass or time
 * involved, and `source` keeps the original error when the failure came from a
 * page call. Caller writeFrame and session close failures propagate unwrapped.
 *
 * @evidence contracts/development/design.md#principled-representation A subclass of the built-in `Error` keeps the stack and `instanceof` checks while adding a typed code, and the original page error is kept as data so wrapping loses nothing a caller could inspect.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The class adds only the two fields a caller needs, a category to branch on and the wrapped cause, and sets `name` so logs identify the adapter as the thrower.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The class wraps errors without retrying, suppressing or translating them into success, and no page, route or test receives a special message.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says who throws it, what each of `code`, `message` and `source` carries, and that `writeFrame` failures are deliberately left unwrapped.
 */
export class AutoMovieHeadlessCaptureError extends Error {
  /** The capture step that failed; see `AutoMovieHeadlessCaptureErrorCode`. */
  public readonly code: AutoMovieHeadlessCaptureErrorCode;

  /**
   * The error the page call threw, or `undefined` when the adapter itself
   * detected the failure, as for an empty pass list.
   */
  public readonly source: unknown;

  /**
   * @param code The capture step that failed.
   * @param message Human-readable description naming the page, film, pass or
   *   time involved.
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
