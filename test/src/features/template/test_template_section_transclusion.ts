import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

interface ITransclusionModule {
  transcludeMarkdownSection: {
    sourcePath(markdown: string, scaffoldPath: string): string | null;
    expand(
      markdown: string,
      scaffoldPath: string,
      sourceMarkdown: string,
    ): string;
  };
}

interface IReferenceModule {
  removeMarkdownReferences: {
    strip(markdown: string): string;
  };
}

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
 * @evidence contracts/development/testing.md#behavioral-verification Imports the exact template helpers by runtime path and checks section selection, line boundaries, fence handling, invalid sources and reference stripping directly.
 * @evidence contracts/development/testing.md#independent-expectations Expected Markdown is authored as a literal fixture with separate fake and real headings; the test does not compute the section by repeating the implementation parser.
 * @evidence contracts/development/testing.md#distinguishing-cases Fence-contained markers and headings resemble live syntax but must remain literal; duplicate and missing headings must fail.
 * @evidence contracts/development/testing.md#execution-ownership This in-process test imports only the local helper modules and writes no files.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names each boundary and failure behavior the assertions pin.
 */
export async function test_template_section_transclusion(): Promise<void> {
  const root: string = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../..",
  );
  const transclusion: ITransclusionModule = (await import(
    pathToFileURL(
      path.join(
        root,
        "packages/template/src/scaffold/internal/transcludeMarkdownSection.ts",
      ),
    ).href
  )) as ITransclusionModule;
  const references: IReferenceModule = (await import(
    pathToFileURL(
      path.join(
        root,
        "packages/template/src/scaffold/internal/removeMarkdownReferences.ts",
      ),
    ).href
  )) as IReferenceModule;
  const marker: string = "## $" + "{Continuing}";
  const scaffold: string = [
    "# Copy",
    "```md",
    marker,
    "```",
    marker,
    "",
  ].join("\n");
  const source: string = [
    "# Root",
    "## Before",
    "ignored",
    "```md",
    "## Continuing",
    "fake source section",
    "## Fake boundary",
    "```",
    "## Continuing",
    "body",
    "### Detail",
    "nested",
    "~~~md",
    "## Fake next heading",
    "~~~",
    "## Next",
    "next section",
    "",
  ].join("\n");
  const expected: string = [
    "# Copy",
    "```md",
    marker,
    "```",
    "## Continuing",
    "body",
    "### Detail",
    "nested",
    "~~~md",
    "## Fake next heading",
    "~~~",
    "",
  ].join("\n");

  assert.equal(
    transclusion.transcludeMarkdownSection.expand(
      scaffold,
      ".agents/skills/example/SKILL.md",
      source,
    ),
    expected,
  );
  assert.throws(
    () =>
      transclusion.transcludeMarkdownSection.expand(
        marker,
        ".agents/skills/example/SKILL.md",
        "# No section\n",
      ),
    /exactly one real "## Continuing" heading/u,
  );
  assert.throws(
    () =>
      transclusion.transcludeMarkdownSection.expand(
        marker,
        ".agents/skills/example/SKILL.md",
        "## Continuing\none\n## Continuing\ntwo",
      ),
    /found 2/u,
  );
  assert.throws(
    () =>
      transclusion.transcludeMarkdownSection.sourcePath(
        marker,
        "../outside.md",
      ),
    /safe skill Markdown path/u,
  );

  const notes: string = [
    "before",
    "",
    "<!-- @reference authored note -->",
    "",
    "```md",
    "<!-- @reference fenced example -->",
    "```",
    "after",
    "",
  ].join("\n");
  const notesExpected: string = [
    "before",
    "",
    "```md",
    "<!-- @reference fenced example -->",
    "```",
    "after",
    "",
  ].join("\n");
  assert.equal(
    references.removeMarkdownReferences.strip(notes),
    notesExpected,
  );
}
