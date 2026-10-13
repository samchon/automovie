import { createHash } from "node:crypto";
import fs from "node:fs";
import { readViewerMaintainedSourceFiles } from "../../inspection/readViewerMaintainedSourceFiles.js";

/**
 * Read actual code membership and bytes for the host's watched numerical realm.
 * A startup or reuse compares this witness with the loaded Node realm instead
 * of copying a browser compile stamp. Directory membership is reread as well.
 *
 * @evidence contracts/common.md#principled-implementation Current files and contents, including additions and removals, establish the retained realm's byte identity.
 * @evidence contracts/common.md#clear-and-simple-design One source snapshot owner serves startup and reuse; it creates no numerical cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Git membership, declared watched scopes and current file bytes supply authority without private SDK runtime manifests or expected-source digest literals.
 * @evidence contracts/common.md#meaningful-documentation States source membership and distinct Node authority.
 */
export function readHumanViewerNodeInputs(
  root: string,
  directories: readonly string[],
  files: readonly string[],
): Record<string, string> {
  const selected = new Set(files);
  for (const file of readViewerMaintainedSourceFiles(root, directories)) {
    if (/\.(?:ts|mts|cts|js|mjs|cjs|json|glsl|wgsl)$/.test(file))
      selected.add(file);
  }
  return Object.fromEntries([...selected].sort((a, b) => a < b ? -1 : a > b ? 1 : 0).map((file) => [
    file,
    createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  ]));
}
