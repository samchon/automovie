import { isDeclaration } from "./isDeclaration";

/**
 * Recognizes one complete one-line comment and returns its declaration.
 *
 * @evidence contracts/common.md#principled-implementation Require exact one-line comment delimiters and classify only the enclosed declaration.
 * @evidence contracts/common.md#clear-and-simple-design This helper recognizes syntax while project owns byte-removal decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed spacing and unsupported declarations stay unrecognized without normalization.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies complete comments and delimiter-free declaration output.
 * @evidence contracts/performance.md#efficient-algorithms Prefix, suffix, slicing and grammar checks scale with line length and inner-string allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared classifier and expressions are reused; each current line is recognized independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned text is caller-owned and no line history remains.
 */
export function singleLineDeclaration(line: string): string | undefined {
  if (!line.startsWith("<!-- ") || !line.endsWith(" -->")) return undefined;
  const declaration: string = line.slice(5, -4);
  return isDeclaration(declaration) ? declaration : undefined;
}
