/**
 * Exercise project-owned targets advertised by an initial instruction candidate.
 * Synthetic topics advertise project files, installed instructions and remote
 * references. The shared validator checks resident bytes before installation.
 * No filesystem or installed scaffold supplies this test's expected result.
 */
import { validateAutoMovieInstructionLink } from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Conditional project targets share the same root and decoding rules as
 * links to sibling instruction topics and external primary references.
 *
 * Scenarios:
 *
 * 1. Root Markdown, nested code and data resolve through encoded names,
 *    portable separators, local anchors and HTTP reference routes.
 * 2. The route parser refuses invalid encoding, unsupported schemes,
 *    absolute paths and traversals beyond the project root.
 * 3. Target bytes admit existing headings and resident directory routes;
 *    absent sources, files, headings and directory anchors remain errors.
 */
export const test_cli_scaffold_instruction_project_targets = (): void => {
  const topic = ".agents/skills/source-authoring/topic.md";
  const sources = {
    [topic]: [
      "# Topic",
      "[Policy](../../../README.md#updates)",
      "[Policy again](../../../README.md#)",
      "[Configuration](../../../scripts/configuration.ts)",
      "[Assets](..\\..\\..\\automovie\\assets.json)",
      "[Named file](../../../docs/a%20file.md#an%2Danchor)",
      "[Sibling](other.md) [Local](#topic)",
      "[Shared](../../../AGENTS.md) [Client](../../../CLAUDE.md)",
      "[HTTP](http://example.com) [HTTPS](HTTPS://example.com)",
    ].join("\n"),
    "docs/notes.md": "[Ordinary document](not-recursively-followed.md)",
    ".agents/skills/source-authoring/example.json":
      '{"literal":"[Data](absent.md)"}',
    ".agents/skills/source-authoring/other.md": "# Other\n",
  };
  const resident = [
    ...Object.entries(sources).map(([path, content]) => ({ path, content })),
    { path: "README.md", content: "# Overview\n## Updates\n" },
    {
      path: "scripts/configuration.ts",
      content: "export const kind = 'film';",
    },
    { path: "automovie/assets.json", content: "{}" },
    { path: "docs/a file.md", content: "# Named\n## An anchor\n" },
  ];
  for (const destination of [
    "../../../README.md",
    "../../../README.md#updates",
    "../../../README.md#",
    "../../../docs/a%20file.md#an%2Danchor",
    "..\\..\\..\\automovie\\assets.json",
    "../../../scripts/",
    "../../../scripts/#",
    "#topic",
    "http://example.com",
    "https://example.com",
  ])
    validateAutoMovieInstructionLink(resident, topic, destination);
  for (const [destination, diagnostic] of [
    ["%ZZ", "not valid percent-encoded text"],
    ["#%ZZ", "not valid percent-encoded text"],
    ["mailto:someone@example.com", "unsupported scheme"],
    ["/outside.md", "escapes its project root"],
    ["C:\\outside.md", "escapes its project root"],
    ["../../../../outside.md", "escapes its project root"],
    ["../../../..", "escapes its project root"],
  ]) {
    TestValidator.predicate(
      `validation refuses ${destination}`,
      throwsError(
        () => validateAutoMovieInstructionLink(resident, topic, destination!),
        [diagnostic!],
      ),
    );
  }
  for (const [destination, diagnostic] of [
    ["../../../missing.md", "missing target"],
    ["../../../README.md#absent", "missing anchor"],
    ["../../../scripts/#absent", "anchor targets a directory"],
  ])
    TestValidator.predicate(
      `resident bytes refuse ${destination}`,
      throwsError(
        () => validateAutoMovieInstructionLink(resident, topic, destination!),
        [diagnostic!],
      ),
    );
  TestValidator.predicate(
    "an unpublished source cannot advertise even an external reference",
    throwsError(
      () => validateAutoMovieInstructionLink([], topic, "https://example.com"),
      ["source is not published"],
    ),
  );
};
