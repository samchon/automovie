import { TestValidator } from "@nestia/e2e";

import { selectTestFiles } from "../../helpers/selectTestFiles";

/**
 * Pin the runner's basename selection without importing test modules.
 *
 * Scenarios:
 * 1. Empty argv selects all; repeated include groups union, then exclusions apply.
 * 2. Unknown, valueless, blank, positional and unmatched terms throw.
 * 3. Empty discovery and excluding every selected file throw.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the runner's selection helper on supplied names and compares exact selected basenames and refusal paths, catching widened selection and ignored invalid options without filesystem or process access.
 * @evidence contracts/testing.md#independent-cases Literal filenames and explicit expected subsets define substring semantics, repeated and equals-form groups, input immutability, singleton, empty and malformed requests. Actual discovery/import behavior stays with the runner's installed DynamicExecutor contract and source review.
 */
export function test_test_selection(): void {
  const names: string[] = ["test_jab.ts", "test_cross.ts", "test_kick.ts"];
  TestValidator.equals(
    "default selection",
    [...selectTestFiles([], names)],
    names,
  );
  TestValidator.equals(
    "include union and exclusion",
    [
      ...selectTestFiles(
        ["--include", "jab", "cross", "--include=kick", "--exclude", "cross"],
        names,
      ),
    ],
    ["test_jab.ts", "test_kick.ts"],
  );
  TestValidator.equals(
    "exclude only",
    [...selectTestFiles(["--exclude=kick"], names)],
    ["test_jab.ts", "test_cross.ts"],
  );
  TestValidator.equals(
    "singleton",
    [...selectTestFiles([], ["test_one.ts"])],
    ["test_one.ts"],
  );
  TestValidator.equals(
    "duplicate basenames share selection",
    [...selectTestFiles(["--include=jab"], ["test_jab.ts", "test_jab.ts"])],
    ["test_jab.ts"],
  );
  TestValidator.equals("input unchanged", names, [
    "test_jab.ts",
    "test_cross.ts",
    "test_kick.ts",
  ]);

  for (const argv of [
    ["--unknown"],
    ["jab"],
    ["--include"],
    ["--exclude"],
    ["--include="],
    ["--include", " "],
    ["--include=-jab"],
    ["--include", "--exclude=kick"],
    ["--include=missing"],
    ["--exclude=missing"],
    ["--include=jab", "--exclude=jab"],
  ])
    TestValidator.error(
      `invalid selection ${JSON.stringify(argv)}`,
      (): Set<string> => selectTestFiles(argv, names),
    );
  TestValidator.error(
    "empty discovery",
    (): Set<string> => selectTestFiles([], []),
  );
}
