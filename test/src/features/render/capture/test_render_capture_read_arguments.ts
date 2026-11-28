import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `readCaptureArguments` reads `--key=value`, `--key value` and a bare
 * `--key` into keys and values.
 *
 * Scenarios:
 *
 * 1. "--at=1 --subject hero --xray --views front" reads at 1, subject hero, xray
 *    empty and views front, in order.
 * 2. A key given twice, an argument without `--` and a bare `--` are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines three capture flag spellings, input order and refusal for duplicates or missing key.
 * @evidence contracts/development/testing.md#behavioral-verification Parses mixed equal-sign, split token and bare flags, then submits a repeated key, unsigned argument and empty flag.
 * @evidence contracts/development/testing.md#independent-expectations The input spelling fixes at 1, subject hero, empty xray and views front in order. The invalid cases cannot establish unique valid keys.
 */
export function test_render_capture_read_arguments(): void {
  TestValidator.equals(
    "options",
    [
      ...AutoMovieRenderCapture.readArguments([
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
      AutoMovieRenderCapture.readArguments(argv),
    );
}
