import {
  type IAutoMovieCapturePlanRequest,
  formatAutoMovieCapturePlanRequest,
} from "@automovie/render";

/** An argument a POSIX shell passes through unquoted. */
const PLAIN: RegExp = /^[\w%+,./:=@-]+$/u;

/**
 * Write the `automovie capture` command that repeats a request: its options, and the command line a person copies.
 *
 * Every pair `formatAutoMovieCapturePlanRequest` writes becomes one `--<key>=<value>` option, in its order. The `=` form is used for every option, so a value that starts with `-`, such as an axis cut `-x:0.2`, or that is empty stays the option's value. `readAutoMovieCaptureArguments` reads the options back to the same named values, so the command's reader gives an equal request.
 *
 * The text is `automovie capture` followed by the options, each quoted for a POSIX shell when it holds a character outside letters, digits and `_ % + , . / : = @ -`, such as the `*` of a pattern or the `;` between views.
 *
 * ```ts
 * const { text } = formatAutoMovieInspectorCommand(request);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the option form and why it is used for every option, the round trip through the command's reader, the text's prefix and the quoting rule.
 * @evidence contracts/development/implementation.md#principled-implementation The grammar's writer decides keys and values and the command's own argument reader is the inverse of the `--key=value` form; a single-quoted POSIX word is literal except for `'`, which is closed, escaped and reopened.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map to options and one join with quoting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No option is written by hand, so the command offers exactly what the address carries.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the written request.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh strings and keeps nothing.
 */
export function formatAutoMovieInspectorCommand(
  request: IAutoMovieCapturePlanRequest,
): {
  /** The options after `automovie capture`, one argument each. */
  options: string[];

  /** The whole command line, quoted for a POSIX shell. */
  text: string;
} {
  const options: string[] = formatAutoMovieCapturePlanRequest(request).map(
    ([key, value]: [key: string, value: string]): string =>
      `--${key}=${value}`,
  );
  return {
    options,
    text: ["automovie", "capture", ...options.map(quote)].join(" "),
  };
}

/** One argument as a POSIX shell word. */
function quote(argument: string): string {
  return PLAIN.test(argument)
    ? argument
    : `'${argument.replaceAll("'", "'\\''")}'`;
}
