
interface IAutoMovieEvidenceMarkdownHeading {

  /** Explicit anchor without the leading hash, when the heading declares one. */
  anchor: string | undefined;

  /** ATX heading depth from one through six. */
  depth: number;

  /** One-based source line. */
  line: number;

  /** Visible title without the trailing explicit anchor. */
  title: string;
}


/**
 * Extract visible ATX headings while ignoring comments and fenced examples.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation A line-preserving scanner tracks HTML comments and fenced code, then extracts visible ATX depths, explicit trailing anchors and original line numbers.
 * @evidence contracts/common.md#clear-and-simple-design This lightweight heading inventory serves the already governed document reader without resolving an evidence graph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comment and fenced-example lookalikes never become headings; this scanner supports its stated ATX grammar rather than claiming all CommonMark heading forms.
 * @evidence contracts/common.md#meaningful-documentation The comment states visible ATX selection; returned fields distinguish absent explicit anchor from title and original one-based line.
 * @evidence contracts/performance.md#efficient-algorithms For L characters and F fenced lines, scanning is O(L); a closing regex is currently rebuilt per fenced line and source-line arrays retain O(L) text.
 * @evidence contracts/performance.md#reuse-equivalent-work One visible-line pass serves every returned heading; this helper owns no cross-document cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source-line arrays and scanner state are call-local; the caller receives only heading records and no file handle.
 */
export const parseAutoMovieEvidenceMarkdownHeadings: (source: string) => IAutoMovieEvidenceMarkdownHeading[] = (
  source: string,
): IAutoMovieEvidenceMarkdownHeading[] => {
  const output: IAutoMovieEvidenceMarkdownHeading[] = [];
  for (const [index, line] of visibleMarkdownLines(source).entries()) {
    const heading: RegExpExecArray | null = /^(#{1,6})(?!#)\s+(\S.*)$/u.exec(line);
    if (heading === null) continue;
    const anchored: RegExpExecArray | null = /[ \t]+\{#([^{}\s]+)\}[ \t]*$/u.exec(heading[2]!);
    output.push({
      anchor: anchored?.[1],
      depth: heading[1]!.length,
      line: index + 1,
      title: heading[2]!.replace(/[ \t]+\{#[^{}\s]+\}[ \t]*$/u, ""),
    });
  }
  return output;
};


/** Blank Markdown comments and fenced code without changing line addresses. */
const visibleMarkdownLines: (source: string) => string[] = (source: string): string[] => {
  const output: string[] = [];
  let fence: { character: "`" | "~"; length: number } | undefined;
  let htmlComment: boolean = false;
  for (const sourceLine of source.split(/\r?\n/u)) {
    if (fence !== undefined) {
      if (
        new RegExp(
          `^ {0,3}${fence.character}{${fence.length},}[ \\t]*$`,
          "u",
        ).test(sourceLine)
      )
        fence = undefined;
      output.push("");
      continue;
    }
    let line: string = "";
    for (let cursor: number = 0; cursor < sourceLine.length; ) {
      if (htmlComment) {
        const close: number = sourceLine.indexOf("-->", cursor);
        if (close === -1) {
          line += " ".repeat(sourceLine.length - cursor);
          break;
        }
        line += " ".repeat(close + 3 - cursor);
        cursor = close + 3;
        htmlComment = false;
      } else {
        const open: number = sourceLine.indexOf("<!--", cursor);
        if (open === -1) {
          line += sourceLine.slice(cursor);
          break;
        }
        line += `${sourceLine.slice(cursor, open)}    `;
        cursor = open + 4;
        htmlComment = true;
      }
    }
    const marker: string | undefined = /^ {0,3}(`{3,}|~{3,})/u.exec(line)?.[1];
    if (marker !== undefined) {
      fence = {
        character: marker[0] as "`" | "~",
        length: marker.length,
      };
      output.push("");
      continue;
    }
    output.push(line);
  }
  return output;
};
