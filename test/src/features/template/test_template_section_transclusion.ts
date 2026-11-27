import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { repositoryRoot } from "../internal/repositoryRoot";

/**
 * Section transclusion copies one real root heading and stops at real heading
 * boundaries while preserving fake markers in fenced examples.
 *
 * Scenarios:
 *
 * 1. A fenced marker remains literal while a real marker receives the source
 *    section, including subheadings and fenced heading examples.
 * 2. The replacement has exactly the source section's terminal newline.
 * 3. Missing or duplicate source headings and path traversal fail clearly.
 * 4. `@reference` comments are stripped outside fences and kept inside them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs a focused Node ESM child that imports the exact template helpers by runtime path and checks section selection, line boundaries, fence handling, invalid sources and reference stripping directly.
 * @evidence contracts/development/testing.md#independent-expectations Expected Markdown is authored as a literal fixture with separate fake and real headings; the test does not compute the section by repeating the implementation parser.
 * @evidence contracts/development/testing.md#distinguishing-cases Fence-contained markers and headings resemble live syntax but must remain literal; duplicate and missing headings must fail.
 * @evidence contracts/development/testing.md#execution-ownership This focused child imports only the local helper modules and writes no files.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names each boundary and failure behavior the assertions pin.
 */
export function test_template_section_transclusion(): void {
  const root: string = repositoryRoot();
  const helper: string = path.join(
    root,
    "test/src/features/template/test_template_section_transclusion.mjs",
  );
  const execution = spawnSync(
    process.execPath,
    ["--experimental-strip-types", helper, root],
    { encoding: "utf8" },
  );
  assert.equal(
    execution.status,
    0,
    `Section transclusion child failed:\n${execution.stdout}\n${execution.stderr}`,
  );
}
