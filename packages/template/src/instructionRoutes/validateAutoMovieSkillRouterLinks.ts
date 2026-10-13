import type { IAutoMovieInstructionMarkdownSource } from "./IAutoMovieInstructionMarkdownSource";
import { normalizeSourcePath } from "./normalizeSourcePath";
import { validateSkillFrontmatter } from "./validateSkillFrontmatter";
import { InstructionMarkdown } from "./InstructionMarkdown";
import { validateAutoMovieInstructionLink } from "./validateAutoMovieInstructionLink";
import { validateAutoMovieInstructionDocumentLinks } from "./validateAutoMovieInstructionDocumentLinks";

/**
 * Validate present skill metadata and every local Markdown topic route.
 *
 * Link resolution is performed over an explicit source population so missing
 * files, missing anchors, and root escapes are ordinary deterministic cases.
 * A directory route is accepted only when at least one source is resident
 * below that directory. Topic documents retain their ordinary heading structure;
 * SKILL.md supplies the skill name, description and title.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Refuses an instruction entry point that cannot reach the procedure it advertises.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Keeps every shipped authoring route inside the generated project's complete instruction and contract source population.
 */
export const validateAutoMovieSkillRouterLinks = (
  sources: readonly IAutoMovieInstructionMarkdownSource[],
): void => {
  const files = new Map<string, string>();
  for (const source of sources) {
    const normalized = normalizeSourcePath(source.path);
    if (files.has(normalized))
      throw new Error(`${normalized}: instruction source is duplicated.`);
    files.set(normalized, source.content);
  }
  const skillFiles = [...files].filter(([file]) =>
    file.startsWith(".agents/skills/"),
  );
  const expected = new Set(
    skillFiles.filter(([file]) => file.endsWith("/SKILL.md")).map(([file]) => file),
  );
  for (const file of expected) {
    const markdown = files.get(file)!;
    const name = file.split("/")[2]!;
    const body = validateSkillFrontmatter(file, markdown, name);
    const headings = InstructionMarkdown.visibleLines(body).filter((line) =>
      /^#{1,6}\s+\S/u.test(line),
    );
    if (
      headings.filter((line) => line.startsWith("# ")).length !== 1 ||
      !headings[0]?.startsWith("# ")
    )
      throw new Error(
        `${file}: every SKILL.md must begin with one H1 title.`,
      );
    for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu))
      validateAutoMovieInstructionLink(sources, file, match[1]!);
  }
  for (const [file] of skillFiles)
    if (file.endsWith(".md") && !expected.has(file))
      validateAutoMovieInstructionDocumentLinks(sources, file);
};
