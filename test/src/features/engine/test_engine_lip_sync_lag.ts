import { measureAutoMovieLipSyncLag } from "@automovie/engine";
import type { IAutoMovieMeasureLipSyncLag } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The lip-sync measurement recovers the lag between a mouth series and a level
 * series and judges it by ITU-R BT.1359-1.
 *
 * Scenarios:
 *
 * 1. At 24 fps, where W = 6 frames, a level series equal to the mouth series
 *    shifted so the sound comes 0, −1, −2 and +5 frames after the mouth gives
 *    exactly those lags.
 * 2. The verdicts are the worked ones: 0 frames and −1 frame (−41.7 ms) pass; −2
 *    frames (−83.3 ms) fails because the sound leads by more than 45 ms; +5
 *    frames (+208.3 ms) fails because it trails by more than 125 ms.
 * 3. A constant mouth series is inconclusive.
 * 4. Two runs give identical results.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the shifts, their milliseconds and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds synthetic series to `measureAutoMovieLipSyncLag` and reads its lag and verdict. A sign error, a wrong millisecond conversion or thresholds other than −45 and +125 ms give a different answer.
 * @evidence contracts/development/testing.md#independent-expectations The shifts are constructed, the milliseconds are frames × 1000 / 24, and the thresholds are ITU-R BT.1359-1's; the mouth series is an aperiodic sequence of syllable-like pulses so only the true shift correlates fully.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero, a passing lead, a failing lead, a failing trail and a constant series; the render report and publication gate belong to `test_cli_render_video_lip_sync`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_lip_sync_lag`; it starts no process.
 */
export function test_engine_lip_sync_lag(): void {
  // Syllable-like pulses of uneven length and spacing over 72 frames.
  const pulses: [number, number][] = [
    [8, 4],
    [15, 3],
    [21, 6],
    [31, 2],
    [36, 5],
    [46, 3],
    [53, 7],
    [63, 3],
  ];
  const mouth: number[] = Array.from({ length: 72 }, (_: unknown, t: number) =>
    pulses.some(
      ([start, length]: [number, number]) => t >= start && t < start + length,
    )
      ? 1 + 0.1 * (t % 3)
      : 0,
  );
  const shifted: (shift: number) => number[] = (shift: number): number[] =>
    mouth.map((_: number, t: number): number => mouth[t - shift] ?? 0);
  const measure: (shift: number) => IAutoMovieMeasureLipSyncLag.IResult = (
    shift: number,
  ): IAutoMovieMeasureLipSyncLag.IResult =>
    measureAutoMovieLipSyncLag({ mouth, level: shifted(shift), fps: 24 });

  const results: IAutoMovieMeasureLipSyncLag.IResult[] = [0, -1, -2, 5].map(
    measure,
  );
  TestValidator.equals(
    "the lags and verdicts are the worked ones",
    results.map((r: IAutoMovieMeasureLipSyncLag.IResult): [number, string] => [
      r.lagFrames,
      r.verdict,
    ]),
    [
      [0, "pass"],
      [-1, "pass"],
      [-2, "fail"],
      [5, "fail"],
    ],
  );
  TestValidator.predicate(
    "milliseconds follow frames × 1000 / 24",
    nclose(results[1]!.lagMilliseconds, -1000 / 24, 1e-9) &&
      nclose(results[2]!.lagMilliseconds, -2000 / 24, 1e-9) &&
      nclose(results[3]!.lagMilliseconds, 5000 / 24, 1e-9),
  );

  TestValidator.equals(
    "a constant mouth is inconclusive",
    measureAutoMovieLipSyncLag({
      mouth: new Array(72).fill(3),
      level: shifted(0),
      fps: 24,
    }).verdict,
    "inconclusive",
  );

  TestValidator.predicate(
    "two runs agree exactly",
    JSON.stringify(measure(-2)) === JSON.stringify(measure(-2)),
  );
}
