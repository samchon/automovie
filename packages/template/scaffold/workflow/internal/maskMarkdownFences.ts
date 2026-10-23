/** Masks fenced examples without changing UTF-16 offsets or original input bytes. */
export function maskMarkdownFences(markdown: string): string {
  let marker: string = "";
  let length: number = 0;
  return markdown
    .split(/(?<=\n)/u)
    .map((line: string): string => {
      const fence: RegExpExecArray | null =
        /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/u.exec(line);
      const valid: boolean =
        fence !== null && !(fence[1][0] === "`" && fence[2].includes("`"));
      const masked: boolean = marker !== "" || valid;
      if (valid) {
        if (marker === "") {
          marker = fence[1][0];
          length = fence[1].length;
        } else if (
          fence[1][0] === marker &&
          fence[1].length >= length &&
          fence[2].trim() === ""
        ) {
          marker = "";
          length = 0;
        }
      }
      return masked
        ? line.replace(/[^\r\n]/gu, (character: string): string =>
            " ".repeat(character.length),
          )
        : line;
    })
    .join("");
}
