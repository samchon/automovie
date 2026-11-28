import {
  webVttTime
} from "../../../../../packages/render/src/caption/internal/webVttTime";
import { TestValidator } from "@nestia/e2e";

/**
 * `webVttTime` spells a millisecond offset as `HH:MM:SS.mmm`.
 *
 * Scenarios:
 *
 * 1. Zero is `00:00:00.000`.
 * 2. 1 h 2 min 3 s 4 ms is `01:02:03.004`.
 * 3. Hours past 99 grow a third digit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Formats millisecond offsets with padded minutes, seconds and milliseconds, and preserves large hours.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the formatter for zero, mixed units and a hundred-hour offset.
 * @evidence contracts/development/testing.md#independent-expectations Time arithmetic gives the three literal timestamps, including 4 milliseconds as 004 and a three-digit hour.
 */
export function test_render_caption_web_vtt_time(): void {
  TestValidator.equals("zero", webVttTime(0), "00:00:00.000");
  TestValidator.equals(
    "mixed",
    webVttTime(3_600_000 + 2 * 60_000 + 3_000 + 4),
    "01:02:03.004",
  );
  TestValidator.equals("hundred hours", webVttTime(360_000_000), "100:00:00.000");
}