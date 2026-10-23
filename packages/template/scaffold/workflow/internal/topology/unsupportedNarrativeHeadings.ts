/** Finds H5/H6 syntax which the native inventory deliberately does not materialize. */
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
