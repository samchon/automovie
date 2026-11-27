import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";

/**
 * Write a capture request's option tokens and a shell command to copy.
 *
 * Every pair `formatAutoMovieCapturePlanRequest` writes becomes one
 * `--<key>=<value>` option, in its order. The `=` form is used for every
 * option, so a value that starts with `-`, such as an axis cut `-x:0.2`, or
 * that is empty stays the option's value. `readAutoMovieCaptureArguments` reads
 * the options back to the same named values, so the command's reader gives an
 * equal request.
 *
 * The text starts with the host's executable and arguments, or with `automovie
 * capture` when the caller formats the request alone. The host supplies any
 * options required to reproduce its subject and inputs. POSIX is the default.
 * PowerShell also quotes commas so a script such as `pnpm` receives each list
 * or plane as one argument.
 *
 * ```ts
 * const { text } = AutoMovieViewerInspector.formatCommand(request);
 * ```
 */
export function formatAutoMovieInspectorCommand(
  request: IAutoMovieCapturePlanRequest,
  props: {
    /** Executable and fixed arguments supplied by the capture host. */
    command?: readonly [string, ...string[]];

    /** The shell syntax used for the copied text. Defaults to POSIX. */
    shell?: "posix" | "powershell";
  } = {},
): {
  /** The request's own options, one argument each. */
  options: string[];

  /** The command with the host and request arguments quoted for the shell. */
  text: string;
} {
  const options: string[] = AutoMovieRenderCapture.formatPlanRequest(request).map(
    ([key, value]: [key: string, value: string]): string => `--${key}=${value}`,
  );
  const powershell: boolean = props.shell === "powershell";
  const quote: (argument: string) => string = powershell
    ? quotePowerShell
    : quotePosix;
  const [executable, ...fixed]: readonly [string, ...string[]] =
    props.command ?? ["automovie", "capture"];
  const program: string = quote(executable);
  return {
    options,
    text: [
      powershell && program !== executable ? `& ${program}` : program,
      ...fixed.map(quote),
      ...options.map(quote),
    ].join(" "),
  };
}

/** An argument a POSIX shell passes through unquoted. */
const PLAIN: RegExp = /^[\w%+,./:=@-]+$/u;

/** A bare word that also stays one argument to a PowerShell script. */
const POWERSHELL_PLAIN: RegExp = /^[\w+./:=-]+$/u;

/** One argument as a POSIX shell word. */
function quotePosix(argument: string): string {
  return PLAIN.test(argument)
    ? argument
    : `'${argument.replaceAll("'", "'\\''")}'`;
}

/** One argument as a PowerShell word, including smart single quotes. */
function quotePowerShell(argument: string): string {
  return POWERSHELL_PLAIN.test(argument)
    ? argument
    : `'${argument.replace(/['\u2018-\u201b]/gu, "$&$&")}'`;
}
