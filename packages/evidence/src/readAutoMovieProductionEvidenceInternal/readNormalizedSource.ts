import fs from "node:fs";


/** Read source in the same BOM and line-ending form the builder executes.
 *
 * @evidence contracts/common.md#principled-implementation Synchronous UTF-8 source reading removes one leading BOM and maps CRLF or CR to LF, matching the builder's executed source form.
 * @evidence contracts/common.md#clear-and-simple-design One normalization boundary defines the source digest and parser denominator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only builder-defined encoding normalization occurs; authored code and comment content are otherwise preserved.
 * @evidence contracts/common.md#meaningful-documentation The comment states BOM and line-ending equivalence with builder execution.
 * @evidence contracts/performance.md#efficient-algorithms Reading and normalization are O(L) for source size L, with original and normalized strings potentially coexisting.
 * @evidence contracts/performance.md#reuse-equivalent-work One normalized source serves hashing and AST parsing within the caller's export scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous read closes internally; only the normalized string escapes without retained descriptor.
 */
export const readNormalizedSource: (file: string) => string = (file: string): string => {
  let source: string = fs.readFileSync(file, "utf8");
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  return source.replace(/\r\n?/gu, "\n");
};
