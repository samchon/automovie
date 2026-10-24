/**
 * Finds H5/H6 syntax which the native inventory deliberately does not materialize.
 *
 * @evidence contracts/common.md#principled-implementation A line-state scanner finds H5/H6 ATX syntax missing from native H1-H4 units, while matched fenced examples, HTML comments and pre/code regions remain inert; it is a targeted supplement rather than a full Markdown parser.
 * @evidence contracts/common.md#clear-and-simple-design The scanner only supplies the deeper-heading prohibition to topology validation, leaving supported heading identity extraction to native inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fence characters/lengths and rendered example tags are syntax rules; no authored heading is rewritten or conditionally accepted for a consumer.
 * @evidence contracts/common.md#meaningful-documentation The comment states the native inventory gap, and state variables make fenced, commented and rendered exclusions explicit.
 * @evidence contracts/performance.md#efficient-algorithms For b content characters and l lines, splitting and state scanning use O(b) ordinary text work plus per-line regular-expression searches; retained split lines and discovered levels use O(b + l) worst-case storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Native heading extraction remains shared with other checks; this supplemental content scan is recomputed per document because no independent cross-request result owner exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parser state is constant-sized and the returned levels array is bounded by line count; split text is released after return and no file or task is acquired.
 */
export function unsupportedNarrativeHeadings(content: string): number[] {
  const levels: number[] = [];
  let comment: boolean = false;
  let fence: string = "";
  let fenceLength: number = 0;
  let rendered: string = "";
  for (const line of content.split(/\r?\n/u)) {
    if (rendered !== "") {
      if (new RegExp(`</${rendered}\\s*>`, "iu").test(line)) rendered = "";
      continue;
    }
    if (fence !== "") {
      const closing: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})\s*$/u.exec(
        line,
      );
      if (
        closing &&
        closing[1][0] === fence &&
        closing[1].length >= fenceLength
      )
        fence = "";
      continue;
    }
    if (!comment && rendered === "") {
      const opening: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(
        line,
      );
      if (opening && !(opening[1][0] === "`" && opening[2].includes("`"))) {
        fence = opening[1][0];
        fenceLength = opening[1].length;
        continue;
      }
    }
    let visible: string = "";
    let cursor: number = 0;
    while (cursor < line.length) {
      if (comment) {
        const closing: number = line.indexOf("-->", cursor);
        if (closing < 0) break;
        visible += " ".repeat(closing + 3 - cursor);
        cursor = closing + 3;
        comment = false;
      } else {
        const opening: number = line.indexOf("<!--", cursor);
        if (opening < 0) {
          visible += line.slice(cursor);
          break;
        }
        visible += line.slice(cursor, opening) + "    ";
        cursor = opening + 4;
        comment = true;
      }
    }
    const opening: RegExpExecArray | null = /<(pre|code)\b[^>]*>/iu.exec(
      visible,
    );
    if (opening) {
      if (!new RegExp(`</${opening[1]}\\s*>`, "iu").test(visible))
        rendered = opening[1].toLowerCase();
      continue;
    }
    const heading: RegExpExecArray | null = /^ {0,3}(#{5,6})[ \t]+\S/u.exec(
      visible,
    );
    if (heading !== null) levels.push(heading[1].length);
  }
  return levels;
}
