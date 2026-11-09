import assert from "node:assert/strict";

import { readMovieTestSelection } from "../../internal/readMovieTestSelection";

/**
 * Pin that test selection is decided from filenames before any import.
 *
 * Scenarios:
 * 1. Without options every file is imported.
 * 2. `--include` admits only matching files, so an unmatched heavy file is
 *    never imported; repeated includes form a union.
 * 3. `--exclude` drops matching files and exported functions.
 * 4. An unknown option or an empty value throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios the selection must keep.
 * @evidence contracts/development/testing.md#behavioral-verification Calls readMovieTestSelection, which test/index.ts uses before importing, and checks its file and case verdicts; a function-name include or an include applied after import fails.
 * @evidence contracts/development/testing.md#independent-expectations Each verdict follows from substring rules on literal paths written in the test.
 * @evidence contracts/development/testing.md#distinguishing-cases No options, a single include, a union, a file and function exclusion, a Windows separator and each refused option distinguish the rules.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with in-memory strings, discovered by test/index.ts as an exported test_ function; it imports no test module.
 */
export function test_read_movie_test_selection(): void {
  const heavy: string = "composition/films/test_kickboxing_schedule.ts";
  const planner: string = "executable/test_plan_capture_stills.ts";

  const all: readMovieTestSelection.ISelection = readMovieTestSelection([]);
  assert.equal(all.acceptFile(heavy), true);
  assert.equal(all.acceptCase(planner, "test_plan_capture_stills"), true);

  const included: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--include",
    "plan_capture",
  ]);
  assert.equal(included.acceptFile(heavy), false);
  assert.equal(included.acceptFile(planner), true);
  assert.equal(included.acceptFile("executable\\test_plan_capture_stills.ts"), true);
  const union: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--include",
    "plan_capture",
    "--include",
    "kickboxing_schedule",
  ]);
  assert.equal(union.acceptFile(heavy), true);

  const excluded: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--exclude",
    "schedule",
  ]);
  assert.equal(excluded.acceptFile(heavy), false);
  assert.equal(excluded.acceptCase(planner, "test_schedule_case"), false);
  assert.equal(excluded.acceptCase(planner, "test_plan_capture_stills"), true);

  assert.throws(() => readMovieTestSelection(["--only", "x"]));
  assert.throws(() => readMovieTestSelection(["--include", ""]));
  assert.throws(() => readMovieTestSelection(["--include"]));
}
