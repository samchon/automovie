import {
  type IAutoMovieInstructionMarkdownSource,
  validateAutoMovieInstructionDocumentLinks,
  validateAutoMovieInstructionLink,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * Instruction routes resolve against the caller's complete in-memory candidate
 * with visible Markdown anchors and one portable project-root boundary.
 *
 * Scenarios:
 *
 * 1. Files, directories, encoded anchors and numbered repeated headings resolve.
 * 2. Missing sources, targets and visible anchors refuse; code-fenced headings
 *    do not create an advertised instruction target.
 * 3. Invalid escapes, unsupported schemes and Windows/POSIX root escapes refuse.
 * 4. Document-link traversal uses the same admission and preserves source bytes.
 */
export const test_template_instruction_routes = (): void => {
  const sources: IAutoMovieInstructionMarkdownSource[] = [
    { path: "README.md", content: "# Home\n[topic](docs/topic.md#repeat-1)\n[remote](https://example.com)" },
    { path: "docs/topic.md", content: "# Topic\n## Repeat\n## Repeat\n## Visible {#explicit-id}\n## Name_1 - two!\n```md\n## Hidden\n```" },
    { path: "data/value.json", content: "{}" },
  ];
  const before = JSON.stringify(sources);
  for (const route of ["docs/topic.md", "docs/", "data/value.json", "docs/topic.md#",
    "docs/topic.md#repeat", "docs/topic.md#repeat-1", "docs/topic.md#explicit%2Did",
    "docs/topic.md#name_1---two", "#home", "https://example.com", "HTTP://example.com"])
    validateAutoMovieInstructionLink(sources, "README.md", route);
  validateAutoMovieInstructionLink(sources, "docs\\topic.md", "../README.md#home");
  validateAutoMovieInstructionDocumentLinks(sources, "README.md");
  TestValidator.equals("route reads do not mutate candidate", JSON.stringify(sources), before);
  TestValidator.error("missing source", () => validateAutoMovieInstructionLink(sources, "absent.md", "README.md"));
  TestValidator.error("missing document traversal source", () => validateAutoMovieInstructionDocumentLinks(sources, "absent.md"));
  for (const route of ["absent.md", "docs/topic.md#absent", "docs/topic.md#hidden", "docs/#heading",
    "%ZZ", "docs/topic.md#%ZZ", "/root.md", "C:\\root.md", "../root.md", "file:root.md", "mailto:a@example.com"])
    TestValidator.error("malformed or unavailable route", () => validateAutoMovieInstructionLink(sources, "README.md", route));
  for (const source of [".", "..", "../README.md", "/README.md"])
    TestValidator.error("source path outside candidate root", () => validateAutoMovieInstructionLink(sources, source, "README.md"));
  TestValidator.error("document link propagates target refusal", () => validateAutoMovieInstructionDocumentLinks([
    { path: "README.md", content: "# Home\n[missing](absent.md)" },
  ], "README.md"));
};
