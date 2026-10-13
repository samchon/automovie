import { createHash } from "node:crypto";
import fs from "node:fs";
import { readViewerMaintainedSourceFiles } from "../../inspection/readViewerMaintainedSourceFiles.js";

/**
 * Read actual code membership and bytes for the host's watched numerical realm.
 * A startup or reuse compares this witness with the loaded Node realm instead
 * of copying a browser compile stamp. Directory membership is reread as well.
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
