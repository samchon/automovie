/**
 * Named text values a capture request is read from: a page address, a command
 * line, or a component's props written as text.
 *
 * `URLSearchParams` and `Map<string, string>` both satisfy it as they are, so
 * the page passes its address's parameters and the command passes the map
 * `readCaptureArguments` makes, and neither host parses an option
 * itself.
 */
export interface IAutoMovieCaptureRequestSource {
  /**
   * The text of a key, null or undefined when the key is absent, and the empty
   * string for a key given without a value, which turns a switch on.
   */
  get(key: string): string | null | undefined;

  /** Every key given, a key given twice listed twice. */
  keys(): Iterable<string>;
}
