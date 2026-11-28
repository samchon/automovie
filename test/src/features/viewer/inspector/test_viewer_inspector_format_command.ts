import { AutoMovieViewerInspector } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.formatCommand` writes a request as `automovie capture`
 * options, single-quoting an argument a shell would split.
 *
 * Scenarios:
 *
 * 1. "at=1" is the option "--at=1" and the text "automovie capture --at=1".
 * 2. A subject "a b's" is quoted as '--subject=a b'''s'.
 * 3. A PowerShell command invokes the quoted host executable with `&`.
 *    Single-quoted module and request arguments double literal ASCII and smart
 *    single quotes and keep the dollar sign literal.
 * 4. A supplied PowerShell script prefix with plain arguments is sent as is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the plain invocation and quoted arguments, including PowerShell executable and path handling.
 * @evidence contracts/development/testing.md#behavioral-verification Passes structured command arguments into the formatter and compares the emitted shell text without launching either command.
 * @evidence contracts/development/testing.md#independent-expectations Expected literals encode spaces and embedded quotes in their respective shell syntax. Distinct executable and script-prefix cases establish when PowerShell needs the invocation operator.
 */
export function test_viewer_inspector_format_command(): void {
  TestValidator.equals(
    "a plain option",
    AutoMovieViewerInspector.formatCommand(AutoMovieViewerInspector.readAddress("at=1")),
    { options: ["--at=1"], text: "automovie capture --at=1" },
  );
  TestValidator.equals(
    "a quoted option",
    AutoMovieViewerInspector.formatCommand(
      AutoMovieViewerInspector.readAddress(`subject=${encodeURIComponent("a b's")}`),
    ).text,
    "automovie capture '--subject=a b'\\''s'",
  );
  TestValidator.equals(
    "PowerShell executable and literal arguments",
    AutoMovieViewerInspector.formatCommand(
      AutoMovieViewerInspector.readAddress(
        `subject=${encodeURIComponent("editor's ‘$cut’")}`,
      ),
      {
        command: [
          "C:\\Program Files\\node.exe",
          "capture",
          "--module=C:\\Film Work\\O'Brien\\subjects.ts",
        ],
        shell: "powershell",
      },
    ),
    {
      options: ["--subject=editor's ‘$cut’"],
      text: "& 'C:\\Program Files\\node.exe' capture '--module=C:\\Film Work\\O''Brien\\subjects.ts' '--subject=editor''s ‘‘$cut’’'",
    },
  );
  TestValidator.equals(
    "PowerShell script prefix",
    AutoMovieViewerInspector.formatCommand(AutoMovieViewerInspector.readAddress("at=1"), {
      command: ["pnpm", "run", "capture"],
      shell: "powershell",
    }).text,
    "pnpm run capture --at=1",
  );
}
