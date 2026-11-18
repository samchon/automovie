import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Alias resolution preserves open arguments and gives authored fixed values precedence.
 *
 * Scenarios:
 * 1. Resolve each alias with no input to discover its fixed parameters.
 * 2. Supply a conflicting value for each fixed key and an independent open key.
 * 3. Resolve the next call independently of the previous caller's values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies parameter merging before the owner's parameter gate.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each registered alias resolver with empty and conflicting arguments.
 * @evidence contracts/development/testing.md#independent-expectations The alias contract fixes precedence and retains caller-owned keys.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes transparent aliases, fixed aliases and aliases over other rows.
 * @evidence contracts/development/testing.md#execution-ownership Exercises plain parameter records without building scenes or plans.
 */
export function test_human_motion_catalogue_contract_parameters(): void {
  for (const rows of Object.values(HUMAN_LEXICON))
    for (const row of rows) {
      if (row.resolve === undefined) continue;
      const fixed: object = row.resolve({});
      const conflicts: Record<string, unknown> = Object.fromEntries(
        Object.keys(fixed).map((key: string) => [key, null]),
      );
      const caller = Object.freeze({ ...conflicts, callerArgument: row.name });
      TestValidator.equals(
        row.name + " fixed precedence and forwarding",
        row.resolve(caller),
        {
          ...fixed,
          callerArgument: row.name,
        },
      );
      TestValidator.equals(
        row.name + " independent calls",
        row.resolve({}),
        fixed,
      );
    }
}
