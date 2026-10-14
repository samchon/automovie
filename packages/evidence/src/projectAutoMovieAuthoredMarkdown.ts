import type { ICommentRegion } from "./parseAutoMovieEvidenceSyntaxInternal/ICommentRegion";
import { markdownCommentRegions } from "./parseAutoMovieEvidenceSyntaxInternal/markdownCommentRegions";
import { ANNOTATION } from "./parseAutoMovieEvidenceSyntaxInternal/ANNOTATION";


/**
 * Removes only structural evidence comments from authored Markdown.
 *
 * General HTML comments, including comments that mix evidence and another tag, remain protected with headings, prose, punctuation and source line endings. Retained-pilot receipts use this authored-body identity separately from their evidence declaration identity.
 *
 *
 * @evidence contracts/common.md#principled-implementation Only closed comments composed of structural evidence rows and their continuations are removed; original nonmetadata text and line endings remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design This authored-body projection separates structural annotation bytes from retained pilot body identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts General comments and authored prose are preserved, without lexical quality rules or generated word-count artifacts.
 * @evidence contracts/common.md#meaningful-documentation The comment defines exactly which comments may be omitted and what canonical source bytes remain protected.
 * @evidence contracts/performance.md#efficient-algorithms For L characters and C selected comments, reverse-order string splicing preserves offsets but can copy O(C L) characters; comment classification scans their text.
 * @evidence contracts/performance.md#reuse-equivalent-work One selected region population supplies all removals; retained-pilot callers currently extract annotations separately, so no repeated-parse savings are claimed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the projected string escapes; source text and region arrays remain caller-local and no file is opened.
 */
export function projectAutoMovieAuthoredMarkdown(source: string): string {
  const regions: ICommentRegion[] = markdownCommentRegions(source).filter(
    (region: ICommentRegion) : boolean => region.closed && isEvidenceComment(region.text),
  );
  let output: string = source;
  for (const region of [...regions].reverse())
    output = output.slice(0, region.start) + output.slice(region.end);
  return output;
}


/** Decide whether a Markdown comment consists only of structural evidence. */
function isEvidenceComment(comment: string): boolean {
  const lines: string[] = comment.split(/\r\n|\r|\n/u).map((line: string) : string =>
    line
      .trim()
      .replace(/^\*\s?/u, "")
      .trim(),
  );
  let continuation: boolean = false;
  let found: boolean = false;
  for (const line of lines) {
    if (line.length === 0) {
      continuation = false;
      continue;
    }
    if (ANNOTATION.test(line)) {
      continuation = true;
      found = true;
    } else if (!continuation || /^@\S/u.test(line)) return false;
  }
  return found;
}
