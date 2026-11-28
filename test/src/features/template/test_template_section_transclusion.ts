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
 * 2. A source body without a final newline retains the CRLF boundary before
 *    the next heading in the destination.
 * 3. Missing or duplicate source headings and path traversal fail clearly.
 * 4. `@reference` comments are stripped outside fences and kept inside them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes how section boundaries, code fences, line endings and reference comments affect the generated Markdown.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the two owning template helpers in a Node ESM child and requires its assertions to pass. The child compares expanded Markdown and stripped references, then checks missing and duplicate section headings and an unsafe source path.
 * @evidence contracts/development/testing.md#independent-expectations Uses literal expected Markdown for the fenced and expanded sections, the CRLF next-heading boundary and the preserved fenced reference. Missing, duplicate and escaping sources have distinct expected error text.
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
