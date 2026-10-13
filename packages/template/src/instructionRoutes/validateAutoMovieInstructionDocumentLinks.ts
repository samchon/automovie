import type { IAutoMovieInstructionMarkdownSource } from "./IAutoMovieInstructionMarkdownSource";
import { normalizeSourcePath } from "./normalizeSourcePath";
import { validateAutoMovieInstructionLink } from "./validateAutoMovieInstructionLink";

/** Validate every Markdown link carried by one instruction document. */
export const validateAutoMovieInstructionDocumentLinks = (
  sources: readonly IAutoMovieInstructionMarkdownSource[],
  sourcePath: string,
): void => {
  const source = normalizeSourcePath(sourcePath);
  const markdown = sources.find(
    (candidate) => normalizeSourcePath(candidate.path) === source,
  )?.content;
  if (markdown === undefined)
    throw new Error(`${source}: instruction route source is not published.`);
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu))
    validateAutoMovieInstructionLink(sources, source, match[1]!);
};
