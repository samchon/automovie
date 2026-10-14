import type { IAutoMovieEvidenceMarkdownHeading } from "./IAutoMovieEvidenceMarkdownHeading";
import { markdownHeadings } from "./markdownHeadings";
import { posix } from "./posix";

/**
 * Require exactly one visible H1 as the first heading and use its title as delivery identity. Nonheading text before that heading is not checked here.
 *
 * @evidence contracts/common.md#principled-implementation The projected heading inventory must contain exactly one H1 at its first position; the returned visible title identifies a narrative file or delivery group. This gate does not inspect nonheading preamble text.
 * @evidence contracts/common.md#clear-and-simple-design Narrative host and index admission share heading parsing instead of independent title regexes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or repeated H1, or another heading before it, refuses without synthesizing a title; matching title strings do not establish prose equivalence.
 * @evidence contracts/common.md#meaningful-documentation Errors include the physical file and the returned title omits explicit anchor syntax.
 * @evidence contracts/performance.md#efficient-algorithms File reading and title filtering add linear byte/heading work to the delegated projection's up to O(C L+C H) repeated copies/searches for L text, C comments and H headings.
 * @evidence contracts/performance.md#reuse-equivalent-work This call uses one heading extraction; group and unit checks currently reread independent files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the title escapes; synchronous file handles and temporary headings are released.
 */
export function narrativeH1(file: string): string {
  const headings: IAutoMovieEvidenceMarkdownHeading[] = markdownHeadings(file);
  const h1: IAutoMovieEvidenceMarkdownHeading[] = headings.filter((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth === 1);
  if (h1.length !== 1 || headings[0]?.depth !== 1)
    throw new Error(
      `${posix(file)} must begin with exactly one H1 narrative title; received ${h1.length}.`,
    );
  return h1[0]!.title;
}
