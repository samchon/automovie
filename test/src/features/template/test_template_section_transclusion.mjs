import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.argv[2];
const transclusion = await import(
  pathToFileURL(
    path.join(
      root,
      "packages/template/src/scaffold/internal/transcludeMarkdownSection.ts",
    ),
  ).href
);
const references = await import(
  pathToFileURL(
    path.join(
      root,
      "packages/template/src/scaffold/internal/removeMarkdownReferences.ts",
    ),
  ).href
);

const marker = "## $" + "{Continuing}";
const scaffold = ["# Copy", "```md", marker, "```", marker, ""].join("\n");
const source = [
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
const expected = [
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
    transclusion.transcludeMarkdownSection.sourcePath(marker, "../outside.md"),
  /safe skill Markdown path/u,
);

const notes = [
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
const notesExpected = [
  "before",
  "",
  "```md",
  "<!-- @reference fenced example -->",
  "```",
  "after",
  "",
].join("\n");
assert.equal(references.removeMarkdownReferences.strip(notes), notesExpected);
