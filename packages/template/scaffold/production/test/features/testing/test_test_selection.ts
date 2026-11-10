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
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the three scenarios, default and grouped selection, malformed options and empty or fully excluded selection, and the selection rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the runner's selection helper on supplied basenames and compares the exact selected set or the thrown refusal; widened selection or an ignored invalid option fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected subsets follow from literal filenames and the runner's substring include and exclude semantics.
 * @evidence contracts/development/testing.md#distinguishing-cases Cases cover default selection, repeated and equals-form include groups with exclusion, exclusion alone, a singleton, duplicate basenames, an unchanged input array, each malformed option, unmatched terms, excluding every match and empty discovery. Discovery and import belong to DynamicExecutor.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with in-memory names, discovered by test/index.ts as an exported test_ function; it reads no file system and starts no process.
 */
export function test_test_selection(): void {
  const names: string[] = ["test_walk.ts", "test_turn.ts", "test_lift.ts"];
  TestValidator.equals(
    "default selection",
    [...selectTestFiles([], names)],
    names,
  );
  TestValidator.equals(
    "include union and exclusion",
    [
      ...selectTestFiles(
        ["--include", "walk", "turn", "--include=lift", "--exclude", "turn"],
        names,
      ),
    ],
    ["test_walk.ts", "test_lift.ts"],
  );
  TestValidator.equals(
    "exclude only",
    [...selectTestFiles(["--exclude=lift"], names)],
    ["test_walk.ts", "test_turn.ts"],
  );
  TestValidator.equals(
    "singleton",
    [...selectTestFiles([], ["test_one.ts"])],
    ["test_one.ts"],
  );
  TestValidator.equals(
    "duplicate basenames share selection",
    [...selectTestFiles(["--include=walk"], ["test_walk.ts", "test_walk.ts"])],
    ["test_walk.ts"],
  );
  TestValidator.equals("input unchanged", names, [
    "test_walk.ts",
    "test_turn.ts",
    "test_lift.ts",
  ]);

  for (const argv of [
    ["--unknown"],
    ["walk"],
    ["--include"],
    ["--exclude"],
    ["--include="],
    ["--include", " "],
    ["--include=-walk"],
    ["--include", "--exclude=lift"],
    ["--include=missing"],
    ["--exclude=missing"],
    ["--include=walk", "--exclude=walk"],
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
