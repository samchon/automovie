import assert from "node:assert/strict";

import { readMovieTestSelection } from "../../internal/readMovieTestSelection";

/**
 * Selection preserves the driver's filename-or-function contract.
 *
 * Scenarios:
 * 1. A filename match and an exported function match in a differently named module both remain discoverable.
 * 2. Explicit repeated file includes form a union; portable path separators and file exclusions apply before import.
 * 3. Function exclusions win, empty selection admits all cases, and missing/empty/unknown options refuse.
 *
 * This portable parser test observes admitted files and cases, not compiler/import performance.
 */
export function test_movie_test_selection(): void {
  const original: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--include",
    "target",
  ]);
  assert.equal(original.acceptFile("alpha/test_target.ts"), true);
  assert.equal(
    original.acceptFile("beta/test_other.ts"),
    true,
    "an unimported module may export a matching function",
  );
  assert.equal(original.acceptCase("alpha/test_target.ts", "test_other"), true);
  assert.equal(
    original.acceptCase("beta/test_other.ts", "test_target_behavior"),
    true,
  );
  assert.equal(
    original.acceptCase("beta/test_other.ts", "test_unrelated"),
    false,
  );
  const files: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--include-file",
    "alpha/test_target.ts",
    "--include-file",
    "beta",
    "--exclude-file",
    "skip",
  ]);
  assert.equal(files.acceptFile("alpha\\test_target.ts"), true);
  assert.equal(files.acceptFile("beta/test_other.ts"), true);
  assert.equal(files.acceptFile("beta/test_skip.ts"), false);
  assert.equal(files.acceptFile("gamma/test_target.ts"), false);
  const exclusion: readMovieTestSelection.ISelection = readMovieTestSelection([
    "--include",
    "target",
    "--exclude",
    "skip",
  ]);
  assert.equal(exclusion.acceptCase("test_target.ts", "test_skip"), false);
  assert.equal(exclusion.acceptFile("test_skip.ts"), false);
  assert.equal(
    readMovieTestSelection([]).acceptCase("any.ts", "test_any"),
    true,
  );
  for (const args of [
    ["--include"],
    ["--exclude", ""],
    ["--include-file", "--exclude"],
    ["--unknown", "target"],
  ])
    assert.throws(
      (): readMovieTestSelection.ISelection => readMovieTestSelection(args),
    );
}
