import { HumanRefusal, throwPotteryRise } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The wheel's `raise` travel, metres (dyadic, so every difference is exact). */
const TRAVEL: number = 0.375;

/**
 * `throwPotteryRise`, the wall rise of `throwPottery.plan`: the authored rise,
 * or by default what remains of the wheel's `raise` travel, refused unless it
 * is positive and stays within that travel.
 *
 * Wheel: 0.375 m of travel.
 *
 * Scenarios:
 *
 * 1. No authored rise takes the remaining 0.25 m when the slider stands at 0.125
 *    m; an authored 0.125 m is kept.
 * 2. A rise of 0.375 m from 0.125 m would end at 0.5 m, past the travel, and a
 *    zero rise, and a slider already at the top, are refused on `rise`.
 */
export function test_motions_handling_throw_pottery(): void {
  TestValidator.equals(
    "the default and the authored rise",
    [
      throwPotteryRise(undefined, TRAVEL, 0.125),
      throwPotteryRise(0.125, TRAVEL, 0.125),
    ],
    [0.25, 0.125],
  );
  const refused = (
    rise: number | undefined,
    start: number,
  ): HumanRefusal["axis"] | undefined => {
    try {
      throwPotteryRise(rise, TRAVEL, start);
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "a rise past the travel, a zero rise and a full slider are refused",
    [refused(0.375, 0.125), refused(0, 0.125), refused(undefined, TRAVEL)],
    ["rise", "rise", "rise"],
  );
}
