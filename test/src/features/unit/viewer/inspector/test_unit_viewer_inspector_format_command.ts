import {
  formatAutoMovieInspectorCommand,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieInspectorCommand` writes a request as `automovie capture`
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
 */
export function test_unit_viewer_inspector_format_command(): void {
  TestValidator.equals(
    "a plain option",
    formatAutoMovieInspectorCommand(readAutoMovieInspectorAddress("at=1")),
    { options: ["--at=1"], text: "automovie capture --at=1" },
  );
  TestValidator.equals(
    "a quoted option",
    formatAutoMovieInspectorCommand(
      readAutoMovieInspectorAddress(`subject=${encodeURIComponent("a b's")}`),
    ).text,
    "automovie capture '--subject=a b'\\''s'",
  );
  TestValidator.equals(
    "PowerShell executable and literal arguments",
    formatAutoMovieInspectorCommand(
      readAutoMovieInspectorAddress(
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
    formatAutoMovieInspectorCommand(readAutoMovieInspectorAddress("at=1"), {
      command: ["pnpm", "run", "capture"],
      shell: "powershell",
    }).text,
    "pnpm run capture --at=1",
  );
}
