/**
 * Masks fenced examples without changing UTF-16 offsets or original input bytes.
 *
 * @evidence contracts/common.md#principled-implementation A line-state scan recognizes compatible backtick/tilde opening and closing fences, replacing fenced characters with equal UTF-16-width spaces while preserving newlines and leaving input bytes unchanged.
 * @evidence contracts/common.md#clear-and-simple-design This helper masks examples before structural detection so consumers can retain original offsets without implementing a full Markdown renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fence marker/length and the backtick-info restriction follow the supported Markdown fence grammar, independent of fixture content; unclosed fences remain masked to end of input.
 * @evidence contracts/common.md#meaningful-documentation The comment promises offset preservation and input immutability; state transitions retain matching marker and minimum closing length.
 * @evidence contracts/performance.md#efficient-algorithms Splitting lines, anchored fence checks and width-preserving replacement scan the input, with O(n) text/output space; valid-fence tests and per-character repeat account for UTF-16 width.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The state belongs to one input string; this transformation coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Line arrays and masked strings are local to the call and its returned output; no module cache, handle or task is retained.
 */
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
      if (fence !== null && valid) {
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
