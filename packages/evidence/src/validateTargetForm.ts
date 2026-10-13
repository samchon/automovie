import fs from "node:fs";
import type { IAutoMovieEvidenceHeadingIdentity } from "./IAutoMovieEvidenceHeadingIdentity";
import type { IAutoMovieEvidenceMarkdownHeading } from "./IAutoMovieEvidenceMarkdownHeading";
import { markdownHeadings } from "./markdownHeadings";
import { markdownIdentities } from "./markdownIdentities";
import { visibleMarkdownLines } from "./visibleMarkdownLines";

/**
 * Require one leading H1, a scope preamble and explicit H2 targets with one Review question and a final Sources line.
 *
 * @evidence contracts/common.md#principled-implementation Require one leading H1, a scope preamble and explicit H2 targets with one Review question and a final Sources line.
 * @evidence contracts/common.md#clear-and-simple-design Visible Markdown projection and identity admission supply the same target grammar for bundled and local contracts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only local contracts may have a comment-only evidence preamble; fixed section labels define format and do not score the answer's wording.
 * @evidence contracts/common.md#meaningful-documentation Return H2 identities in document order and throw with relative path or target anchor when structural form is invalid.
 * @evidence contracts/performance.md#efficient-algorithms Several reads and projections scan document bytes; checking each target body together follows total body lines and target count.
 * @evidence contracts/performance.md#reuse-equivalent-work Visible lines are reused for scope and all section checks, while heading and identity helpers currently reread the file.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Buffers and heading records are call-local; the caller owns returned identities and no open file handle escapes.
 */
export function validateTargetForm(relative: string, file: string, allowEvidencePreamble: boolean = false): IAutoMovieEvidenceHeadingIdentity[] {
  const source: string = fs.readFileSync(file, "utf8");
  const headings: IAutoMovieEvidenceMarkdownHeading[] = markdownHeadings(file);
  const h1: IAutoMovieEvidenceMarkdownHeading[] = headings.filter((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth === 1);
  const h1Offset: number = source.search(/^#(?!#)[ \t]+\S/mu);
  const preamble: string = h1Offset === -1 ? source : source.slice(0, h1Offset);
  const preambleIsOnlyComments: boolean =
    allowEvidencePreamble &&
    preamble.replace(/<!--[\s\S]*?-->/gu, "").trim().length === 0;
  if (
    h1.length !== 1 ||
    headings[0]?.depth !== 1 ||
    (/^#(?!#)[ \t]+\S/u.test(source.trimStart()) === false &&
      !preambleIsOnlyComments)
  )
    throw new Error(
      `${relative} must begin with exactly one H1; received ${h1.length}.`,
    );
  const deeper: IAutoMovieEvidenceMarkdownHeading | undefined = headings.find((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth >= 3);
  if (deeper !== undefined)
    throw new Error(
      `${relative}:${deeper.line} uses H${deeper.depth}; evidence targets use only H1 and anchored H2 units.`,
    );
  const units: IAutoMovieEvidenceHeadingIdentity[] = markdownIdentities(file, [2]);
  const lines: readonly string[] = visibleMarkdownLines(source);
  const scope: string = lines
    .slice(h1[0]!.line, units[0]!.line - 1)
    .join("\n")
    .trim();
  if (scope.length === 0)
    throw new Error(
      `${relative} must state its target scope between H1 and H2.`,
    );
  for (const [index, unit] of units.entries()) {
    const nextLine: number | undefined = units[index + 1]?.line;
    const body: string[] = lines.slice(
      unit.line,
      nextLine === undefined ? lines.length : nextLine - 1,
    );
    const reviewQuestions: string[] = body.filter((line: string): boolean =>
      /^Review question:\s+\S/u.test(line),
    );
    const sources: string[] = body.filter((line: string): boolean => /^Sources:\s+\S/u.test(line));
    if (reviewQuestions.length !== 1 || sources.length !== 1)
      throw new Error(
        `${relative}#${unit.anchor} must contain exactly one Review question and one Sources line; received ${reviewQuestions.length} and ${sources.length}.`,
      );
    let last: string | undefined;
    for (let cursor: number = body.length - 1; cursor >= 0; cursor--)
      if (body[cursor]!.trim().length !== 0) {
        last = body[cursor];
        break;
      }
    if (last?.startsWith("Sources: ") !== true)
      throw new Error(
        `${relative}#${unit.anchor} must end with its Sources line.`,
      );
  }
  return units;
}
