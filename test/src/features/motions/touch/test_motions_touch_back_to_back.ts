import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  backToBackTogether
} from "../../../../../packages/motions/src/touch/internal/backToBackTogether";
import { TestValidator } from "@nestia/e2e";

/**
 * Check when two back-to-back bear intervals can support each other.
 *
 * Scenarios:
 *
 * 1. For a lean from 1 to 3 s, admit a partner from 1.03 to 2.97 s.
 * 2. Refuse a 1.5 s start or 2.5 s finish on `with` . Refuse a 3.5 s partner
 *    finish on `hold` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify early and late mismatches and their refusal axes.
 * @evidence contracts/development/testing.md#behavioral-verification The pairing helper compares both sides of the declared bearing windows.
 * @evidence contracts/development/testing.md#independent-expectations The admitted offset is less than 1/24 s and the other displacements are a half second.
 */
export function test_motions_touch_back_to_back(): void {
  const mine: backToBackTogether.IWindow = { ready: 1, relax: 3 };
  const refused = (
    partner: backToBackTogether.IWindow,
  ): AutoMovieMotionHumanRefusal["axis"] | undefined => {
    try {
      backToBackTogether(mine, partner, "partner-lean", 1);
      return undefined;
    } catch (error: unknown) {
      return error instanceof AutoMovieMotionHumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "leans within a frame pair, others are refused on their axis",
    [
      refused({ ready: 1.03, relax: 2.97 }),
      refused({ ready: 1, relax: 2.5 }),
      refused({ ready: 1.5, relax: 3 }),
      refused({ ready: 1, relax: 3.5 }),
    ],
    [undefined, "with", "with", "hold"],
  );
}
