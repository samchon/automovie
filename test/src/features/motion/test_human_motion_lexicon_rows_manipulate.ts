import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The manipulation catalogue binds named techniques to their intended hand and digit.
 *
 * Scenarios:
 * 1. Compare each technique's resolved arguments to its hand and optional fixed digit.
 * 2. Check that the registered names expose all seven techniques and their underlying action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hand and digit bindings checked.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves every registered manipulation technique.
 * @evidence contracts/development/testing.md#independent-expectations A fretting hand, strumming hand, typing finger and dialling finger each have their own named binding.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both hands, single hands, fixed digits and open digits.
 * @evidence contracts/development/testing.md#execution-ownership Works entirely on registered parameter records.
 */
export function test_human_motion_lexicon_rows_manipulate(): void {
  const rows: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.manipulate ?? [];
  const names: string[] = rows.map(
    (r: IAutoMovieMotionHumanActionLaw<never>): string => r.name,
  );
  const techniques: readonly Technique[] = [
    ["type", "both"],
    ["typeTwoFinger", "both", "index"],
    ["play", "both"],
    ["fret", "left"],
    ["strum", "right"],
    ["dial", "right", "index"],
    ["thumbText", "right", "thumb"],
  ];
  const expected: string[] = ["manipulate"];
  for (const [name, side, digit] of techniques) {
    expected.push(name);
    const law: IAutoMovieMotionHumanActionLaw<never> | undefined = rows.find(
      (row: IAutoMovieMotionHumanActionLaw<never>): boolean =>
        row.name === name,
    );
    TestValidator.equals(name + " owner", law?.family, "manipulate");
    TestValidator.equals(
      name + " hand and digit",
      law?.resolve?.({ side: "caller", digit: "middle" }),
      { side, digit: digit ?? "middle" },
    );
  }
  TestValidator.equals(
    "registered manipulation techniques",
    names.sort(),
    expected.sort(),
  );
}

/** Public row name, fixed hand and optional fixed digit. */
type Technique = readonly [string, string, string?];
