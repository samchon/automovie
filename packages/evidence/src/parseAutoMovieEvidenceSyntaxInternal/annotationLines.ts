import { ANNOTATION } from "./ANNOTATION";


/** Join formatter-wrapped annotation reasons within one native carrier.
 *
 * @evidence contracts/common.md#principled-implementation A forward line scan joins formatter-wrapped reasons until a blank line or another tag, preserving start/end source lines.
 * @evidence contracts/common.md#clear-and-simple-design One native-row helper serves Markdown and TypeScript admitted comment carriers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only evidence-prefixed starts create declarations; continuation never consumes the next tag or blank paragraph.
 * @evidence contracts/common.md#meaningful-documentation The comment states formatter wrapping and native carrier ownership, and returned rows expose original line bounds.
 * @evidence contracts/performance.md#efficient-algorithms For L comment characters, line normalization and scanning are O(L); concatenating a long reason can copy repeatedly within its total wrapped length.
 * @evidence contracts/performance.md#reuse-equivalent-work Each comment is normalized once per call and one scan consumes all its evidence rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only row text and line numbers escape; normalized line arrays are released after return without external resources.
 */
export function annotationLines(
  comment: string,
  startingLine: number,
): Array<{ endLine: number; line: number; text: string }> {
  const lines: string[] = comment.split(/\r\n|\r|\n/u).map((line: string) : string =>
    line
      .trim()
      .replace(/^\*\s?/u, "")
      .trim(),
  );
  const output: Array<{ endLine: number; line: number; text: string }> = [];
  for (let index: number = 0; index < lines.length; index++) {
    const text: string = lines[index]!;
    if (!ANNOTATION.test(text)) continue;
    let joined: string = text;
    let cursor: number = index + 1;
    while (
      cursor < lines.length &&
      lines[cursor]!.length !== 0 &&
      !ANNOTATION.test(lines[cursor]!) &&
      !/^@\S/u.test(lines[cursor]!)
    ) {
      joined += ` ${lines[cursor]!}`;
      cursor++;
    }
    output.push({
      line: startingLine + index,
      endLine: startingLine + cursor - 1,
      text: joined,
    });
    index = cursor - 1;
  }
  return output;
}
