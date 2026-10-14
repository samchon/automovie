import { createHash } from "node:crypto";
import fs from "node:fs";
import { readViewerMaintainedSourceFiles } from "../../inspection/readViewerMaintainedSourceFiles.js";

/**
 * Read actual code membership and bytes for the host's watched numerical realm. A startup or reuse compares this witness with the loaded Node realm instead of copying a browser compile stamp. Directory membership is reread as well.
 *
 * @evidence contracts/common.md#principled-implementation Maintained source membership plus explicit input files form a fresh sorted byte-hash witness for the watched checked Node realm.
 * @evidence contracts/common.md#clear-and-simple-design One selected-path Set and canonical maintained-file reader avoid browser compile-stamp substitution or another source loader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Directory membership is reread so newly added supported code enters authority instead of being ignored because no module imported it.
 * @evidence contracts/common.md#meaningful-documentation The comment defines actual membership/byte observation and checked-startup or reuse comparison.
 * @evidence contracts/performance.md#efficient-algorithms Membership traversal delegates to its owner and each selected file is read/hashed once; sorting n paths costs O(n log n).
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate explicit/discovered paths share one Set entry, but file bytes and membership are observed anew rather than memoized here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result retains one digest string per selected path, while synchronous reads retain no open descriptors or cross-call byte buffers.
 */
export function readHumanViewerNodeInputs(
  root: string,
  directories: readonly string[],
  files: readonly string[],
): Record<string, string> {
  const selected: Set<string> = new Set(files);
  for (const file of readViewerMaintainedSourceFiles(root, directories)) {
    if (/\.(?:ts|mts|cts|js|mjs|cjs|json|glsl|wgsl)$/.test(file))
      selected.add(file);
  }
  return Object.fromEntries([...selected].sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).map((file: string): [string, string] => [
    file,
    createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  ]));
}
