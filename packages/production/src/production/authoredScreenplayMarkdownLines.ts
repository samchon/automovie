



/**
 * Expose authored Markdown lines while excluding examples and HTML comments.
 *
 * @evidence contracts/common.md#principled-implementation A line scan tracks fenced code delimiters and comment state, preserving visible text and line boundaries while excluding metadata/examples from scene-heading admission.
 * @evidence contracts/common.md#clear-and-simple-design parseScreenplayProse consumes one normalized line population and owns scene boundaries, independent of arbitrary natural-language content.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fence closure must use the same marker and sufficient length with no decoration; quoted headings and comment metadata cannot become authored scene identities.
 * @evidence contracts/common.md#meaningful-documentation States comment/example exclusion and preservation of visible document boundaries.
 * @evidence contracts/performance.md#efficient-algorithms For B text characters and L lines, normalization/splitting and scanning cost O(B), with O(B+L) output and split-line storage; partial visible comment lines are copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parse reads current text once and shares the resulting line population with its section scan; no cross-document result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All strings and scan state belong to the call and the returned lines transfer to the parser; no handle or task is acquired.
 */
export function authoredScreenplayMarkdownLines(content: string): string[] {
  const lines: string[] = [];
  let fence: string | undefined;
  let fenceLength: number = 0;
  let htmlComment: boolean = false;
  for (const sourceLine of content.replace(/\r\n/gu, "\n").split("\n")) {
    if (fence !== undefined) {
      const trimmed: string = sourceLine.replace(/^[ \t]+/u, "");
      const indent: number = sourceLine.length - trimmed.length;
      if (indent <= 3 && trimmed[0] === fence) {
        let length: number = 0;
        while (length < trimmed.length && trimmed[length] === fence) ++length;
        if (
          length >= fenceLength &&
          trimmed.slice(length).trim().length === 0
        ) {
          fence = undefined;
          fenceLength = 0;
        }
      }
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
    const trimmed: string = line.replace(/^[ \t]+/u, "");
    const indent: number = line.length - trimmed.length;
    const marker: string | undefined = trimmed[0];
    if (
      indent <= 3 &&
      trimmed.length >= 3 &&
      (marker === "`" || marker === "~")
    ) {
      let length: number = 0;
      while (length < trimmed.length && trimmed[length] === marker) ++length;
      if (length >= 3) {
        fence = marker;
        fenceLength = length;
        continue;
      }
    }
    lines.push(line);
  }
  return lines;
}
