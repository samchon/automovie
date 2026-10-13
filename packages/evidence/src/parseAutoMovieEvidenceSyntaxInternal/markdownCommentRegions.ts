import type { ICommentRegion } from "./ICommentRegion";


/** Locate live Markdown HTML comments outside fenced and indented code.
 *
 * @evidence contracts/common.md#principled-implementation One forward scan tracks fence character/length, indented code and open comment offsets, yielding original closed and unterminated intervals.
 * @evidence contracts/common.md#clear-and-simple-design Shared original comment spans support annotation extraction and body projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comment-shaped fenced or indented examples never change outer comment state, and unterminated spans retain closed:false instead of being fabricated as complete.
 * @evidence contracts/common.md#meaningful-documentation Region members identify original offsets, starting line, body text and closure state.
 * @evidence contracts/performance.md#efficient-algorithms For L characters, scanning is O(L) plus substring allocation for comment bodies; line and region arrays retain O(L) text.
 * @evidence contracts/performance.md#reuse-equivalent-work One invocation yields an ordered region list, but separate projection callers currently rescan source and share no parse cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned interval text transfers to the projection owner; temporary line arrays are call-local with no source-size cap or handle.
 */
export function markdownCommentRegions(source: string): ICommentRegion[] {
  const lines: [] | RegExpMatchArray = source.match(/[^\r\n]*(?:\r\n|\r|\n|$)/gu) ?? [];
  if (lines.at(-1) === "") lines.pop();
  const output: ICommentRegion[] = [];
  let absolute: number = 0;
  let open: { start: number; line: number } | undefined;
  let fence: { character: "`" | "~"; length: number } | undefined;
  for (let index: number = 0; index < lines.length; index++) {
    const raw: string = lines[index]!;
    const content: string = raw.replace(/(?:\r\n|\r|\n)$/u, "");
    let cursor: number = 0;
    if (open !== undefined) {
      const close: number = content.indexOf("-->");
      if (close !== -1) {
        const end: number = absolute + close + 3;
        output.push({
          ...open,
          closed: true,
          end,
          text: source.slice(open.start + 4, end - 3),
        });
        open = undefined;
        cursor = close + 3;
      } else {
        absolute += raw.length;
        continue;
      }
    }
    if (cursor === 0) {
      const marker: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(content);
      if (fence !== undefined) {
        if (
          marker !== null &&
          marker[1]![0] === fence.character &&
          marker[1]!.length >= fence.length &&
          marker[2]!.trim() === ""
        )
          fence = undefined;
        absolute += raw.length;
        continue;
      }
      if (/^(?: {4}|\t)/u.test(content)) {
        absolute += raw.length;
        continue;
      }
      if (marker !== null) {
        fence = {
          character: marker[1]![0] as "`" | "~",
          length: marker[1]!.length,
        };
        absolute += raw.length;
        continue;
      }
    }
    while (cursor < content.length) {
      const start: number = content.indexOf("<!--", cursor);
      if (start === -1) break;
      const close: number = content.indexOf("-->", start + 4);
      if (close === -1) {
        open = { start: absolute + start, line: index + 1 };
        break;
      }
      const end: number = absolute + close + 3;
      output.push({
        start: absolute + start,
        closed: true,
        end,
        line: index + 1,
        text: content.slice(start + 4, close),
      });
      cursor = close + 3;
    }
    absolute += raw.length;
  }
  if (open !== undefined)
    output.push({
      ...open,
      closed: false,
      end: source.length,
      text: source.slice(open.start + 4),
    });
  return output;
}
