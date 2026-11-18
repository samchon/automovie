import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import {
  HUMAN_ACTIONS,
  HUMAN_LEXICON,
  HUMAN_LEXICON_FAMILIES,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Every exported law can register alongside the built-in actions under its public name.
 *
 * Scenarios:
 * 1. A base action's registry key identifies its law.
 * 2. Every category exports each registered law once, by object identity.
 * 3. No two entries occupy the same registration slot across categories and base actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies namespace lookup and registration across all categories.
 * @evidence contracts/development/testing.md#behavioral-verification Compares the category arrays to the named exports consumers can register.
 * @evidence contracts/development/testing.md#independent-expectations Public export keys and unambiguous lookup determine valid registry slots.
 * @evidence contracts/development/testing.md#distinguishing-cases Visits base actions, independent registered laws and aliases across every category.
 * @evidence contracts/development/testing.md#execution-ownership Reads installed law declarations without preparing a performer.
 */
export function test_human_motion_catalogue_contract_registration(): void {
  const names: Set<string> = new Set();
  for (const [name, law] of Object.entries(HUMAN_ACTIONS)) {
    TestValidator.equals(name + " base registration", law.name, name);
    names.add(name);
  }
  for (const [category, spaces] of Object.entries(HUMAN_LEXICON_FAMILIES)) {
    const rows: readonly IAutoMovieMotionHumanActionLaw<never>[] =
      HUMAN_LEXICON[category]!;
    const exports: Set<unknown> = new Set(
      spaces.flatMap((space: object) => Object.values(space)),
    );
    for (const row of rows) {
      TestValidator.predicate(row.name + " named export", exports.has(row));
      TestValidator.predicate(
        row.name + " available slot",
        !names.has(row.name),
      );
      names.add(row.name);
    }
    for (const value of exports)
      if (typeof value === "object" && value !== null && "plan" in value)
        TestValidator.predicate(
          category + " exported law registration",
          rows.some((row) => row === value),
        );
  }
}
