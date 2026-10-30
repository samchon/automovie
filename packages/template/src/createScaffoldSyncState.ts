import { createHash } from "node:crypto";

import { isScaffoldInstruction } from "./isScaffoldInstruction";

/**
 * Serializes the LF-normalized digests of generated instruction files.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 over canonical LF text records byte identity for later three-way comparison, without claiming semantic acceptance.
 * @evidence contracts/common.md#clear-and-simple-design Rendering and successful sync use this single deterministic state format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only managed instructions enter state; contract and creative bytes are never marked generated.
 * @evidence contracts/common.md#meaningful-documentation The comment states normalization, digest meaning and managed population.
 * @evidence contracts/performance.md#efficient-algorithms Filtering and hashing scan total instruction bytes; sorting costs n log n path comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work One render supplies all already-read file contents; no file is reopened.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned JSON and digest record are caller-owned and bounded by instruction count; no handles are opened.
 */
export function createScaffoldSyncState(
  files: Readonly<Record<string, string>>,
): string {
  const selected: [string, string][] = Object.entries(files).filter(
    ([name]: [string, string]): boolean => isScaffoldInstruction(name),
  );
  selected.sort(
    ([left]: [string, string], [right]: [string, string]): number =>
      left < right ? -1 : left > right ? 1 : 0,
  );
  const hashes: Record<string, string> = Object.fromEntries(
    selected.map(([name, text]: [string, string]): [string, string] => [
      name,
      createHash("sha256").update(text.replaceAll("\r\n", "\n")).digest("hex"),
    ]),
  );
  return JSON.stringify({ version: 1, files: hashes }, null, 2) + "\n";
}
