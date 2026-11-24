import { readAutoMovieCaptureArguments } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `readAutoMovieCaptureArguments` reads `--key=value`, `--key value` and a bare
 * `--key` into keys and values.
 *
 * Scenarios:
 *
 * 1. "--at=1 --subject hero --xray --views front" reads at 1, subject hero, xray
 *    empty and views front, in order.
 * 2. A key given twice, an argument without `--` and a bare `--` are refused.
 */
export function test_unit_render_capture_read_arguments(): void {
  TestValidator.equals(
    "options",
    [
      ...readAutoMovieCaptureArguments([
        "--at=1",
        "--subject",
        "hero",
        "--xray",
        "--views",
        "front",
      ]),
    ],
    [
      ["at", "1"],
      ["subject", "hero"],
      ["xray", ""],
      ["views", "front"],
    ],
  );
  for (const argv of [["--at=1", "--at", "2"], ["at=1"], ["--"]])
    TestValidator.error(argv.join(" "), (): unknown =>
      readAutoMovieCaptureArguments(argv),
    );
}
