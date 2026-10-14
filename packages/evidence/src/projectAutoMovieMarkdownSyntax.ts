import type { ICommentRegion } from "./parseAutoMovieEvidenceSyntaxInternal/ICommentRegion";
import type { IAutoMovieEvidenceSyntaxDocument } from "./IAutoMovieEvidenceSyntaxDocument";
import type { IAutoMovieMarkdownSyntaxProjection } from "./IAutoMovieMarkdownSyntaxProjection";
import { markdownCommentRegions } from "./parseAutoMovieEvidenceSyntaxInternal/markdownCommentRegions";
import { annotationLines } from "./parseAutoMovieEvidenceSyntaxInternal/annotationLines";

const HEADING: RegExp = /^(#{1,6})(?!#)\s+(\S.*)$/u;

const ANCHOR: RegExp = /[ \t]+\{#([^{}\s]+)\}[ \t]*$/u;


/** Projects reader-visible Markdown and its live evidence-comment carriers.
 *
 * @evidence contracts/common.md#principled-implementation Line-preserving visibility removes comments and code examples; each closed comment is assigned to its nearest prior visible heading before wrapped evidence rows are extracted.
 * @evidence contracts/common.md#clear-and-simple-design One result carries both reader-visible lines and structural annotation addresses from the supplied document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unclosed comments do not become declaration carriers, and heading host selection never scores the prose or infers review quality.
 * @evidence contracts/common.md#meaningful-documentation The comment states two projections; annotation members preserve original host and line addresses.
 * @evidence contracts/performance.md#efficient-algorithms For L text, C comments and H headings, visibility replaces spans with repeated string slicing and comment ownership searches copied reversed H arrays, yielding up to O(C L+C H) work; these repeated scans remain unoptimized.
 * @evidence contracts/performance.md#reuse-equivalent-work Visible headings are computed once but comment regions are currently scanned again for annotation extraction; no equivalence cache is claimed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output retains visible line text and annotation rows for its caller; temporary source copies and arrays are released after return, with no external resource.
 */
export function projectAutoMovieMarkdownSyntax(
  document: IAutoMovieEvidenceSyntaxDocument,
): IAutoMovieMarkdownSyntaxProjection {
  const visibleLines: string[] = visibleMarkdownLines(document.source);
  const headings: { line: number; heading: string; }[] = visibleLines
    .map((line: string, index: number) : { line: number; heading: string; } | null => {
      const match: RegExpExecArray | null = HEADING.exec(line);
      return match === null ? null : { line: index + 1, heading: match[2]! };
    })
    .filter(
      (entry: { line: number; heading: string; } | null): entry is { line: number; heading: string } => entry !== null,
    );
  const annotations: { host: string; endLine: number; line: number; text: string; }[] = markdownCommentRegions(document.source)
    .filter((region: ICommentRegion) : boolean => region.closed)
    .flatMap((region: ICommentRegion) : { host: string; endLine: number; line: number; text: string; }[] => {
      const heading: { line: number; heading: string; } | undefined = [...headings]
        .reverse()
        .find((entry: { line: number; heading: string; }) : boolean => entry.line < region.line);
      const host: string =
        heading === undefined
          ? `${document.path}::file`
          : markdownHost(document.path, heading.heading);
      return annotationLines(region.text, region.line).map((annotation: { endLine: number; line: number; text: string; }) : { host: string; endLine: number; line: number; text: string; } => ({
        ...annotation,
        host,
      }));
    });
  return { annotations, visibleLines };
}


/** Blank non-prose Markdown syntax without changing source line addresses. */
function visibleMarkdownLines(source: string): string[] {
  let projected: string = source;
  for (const region of markdownCommentRegions(source).reverse()) {
    const blank: string = source
      .slice(region.start, region.end)
      .replace(/[^\r\n]/gu, " ");
    projected =
      projected.slice(0, region.start) + blank + projected.slice(region.end);
  }
  const output: string[] = [];
  let fence: { character: "`" | "~"; length: number } | undefined;
  const sourceLines: string[] = source.split(/\r\n|\r|\n/u);
  const projectedLines: string[] = projected.split(/\r\n|\r|\n/u);
  for (const [index, projectedLine] of projectedLines.entries()) {
    const marker: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(projectedLine);
    if (fence !== undefined) {
      if (
        marker !== null &&
        marker[1]![0] === fence.character &&
        marker[1]!.length >= fence.length &&
        marker[2]!.trim() === ""
      )
        fence = undefined;
      output.push("");
      continue;
    }
    if (/^(?: {4}| {0,3}\t)/u.test(sourceLines[index]!)) {
      output.push("");
      continue;
    }
    if (marker !== null) {
      fence = {
        character: marker[1]![0] as "`" | "~",
        length: marker[1]!.length,
      };
      output.push("");
      continue;
    }
    output.push(projectedLine.trim().length === 0 ? "" : projectedLine);
  }
  return output;
}


/** Render the Markdown host selected by the last visible heading. */
function markdownHost(path: string, heading: string): string {
  const anchor: string | undefined = ANCHOR.exec(heading)?.[1];
  return anchor === undefined
    ? `${path}::${heading.replace(ANCHOR, "").trim()}`
    : `${path}#${anchor}`;
}
