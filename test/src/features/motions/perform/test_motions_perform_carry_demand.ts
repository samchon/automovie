import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HumanSegmentCarry } from "../../../../../packages/motions/src/perform/internal/HumanSegmentCarry";

/**
 * A displayed pose with no carry demand leaves its hand geometry unread.
 *
 * Scenario: an empty hold population gives an empty carry and makes no request
 * to the active action for its contact windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the displayed operation, the empty input and the eliminated demand.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the carry selector with an empty hold list and a counted contact getter.
 * @evidence contracts/development/testing.md#independent-expectations A carrier can inherit no hold when the input population is empty. The getter count detects unnecessary work even when both implementations return an empty list.
 */
export function test_motions_perform_carry_demand(): void {
  let reads: number = 0;
  const segment: Pick<
    IAutoMovieMotionHumanSegment,
    "plan" | "end" | "entryTime"
  > = {
    end: 1,
    entryTime: 0,
    plan: {
      duration: 1,
      events: [],
      get contacts(): IAutoMovieMotionHumanContactWindow[] {
        ++reads;
        return [];
      },
      posture: (): IAutoMovieMotionHumanPosture => {
        throw new Error("No posture is needed to select a carry");
      },
    },
  };
  TestValidator.equals(
    "empty carry",
    HumanSegmentCarry.borne({ holds: [] }, segment, 0.5),
    [],
  );
  TestValidator.equals("contact geometry not opened", reads, 0);
}
