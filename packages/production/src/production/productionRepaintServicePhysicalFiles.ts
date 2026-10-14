import fs from "node:fs";
import path from "node:path";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Recursively enumerates ordinary files in deterministic code-unit order, refuses encountered linked entries and returns an empty list for an absent root.
 *
 * @evidence contracts/common.md#principled-implementation Recursively enumerates ordinary files in deterministic code-unit order, refuses encountered linked entries and returns an empty list for an absent root; its supplied root is not independently admitted by this enumerator.
 * @evidence contracts/common.md#clear-and-simple-design The recursive helper owns deterministic physical membership only; manifest/schema/byte verification stays in the project/source selector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Entry links refuse, while root links or entry replacement races are not independently fenced here; verified project manifest/file readers must still admit resident bytes before a source can be accepted.
 * @evidence contracts/common.md#meaningful-documentation Returned paths are discovery only, with supplied-root/link-race limitations; directory arrays are local and paths contain no open descriptors or cached file bytes.
 * @evidence contracts/performance.md#efficient-algorithms Work includes each directory's sort and path concatenation; recursive array spreads copy descendant path populations and can reach the host argument limit, while depth and resident file count have no added cap.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Directory arrays are local and returned file paths contain no open descriptors or cached file bytes.
 */
export const productionRepaintServicePhysicalFiles: (root: string) => string[] = (root: string): string[] => {
  if (fs.existsSync(root) === false) return [];
  const output: string[] = [];
  for (const entry of fs
    .readdirSync(root, { withFileTypes: true })
    .sort((left: fs.Dirent<string>, right: fs.Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
    const file: string = path.join(root, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Repaint evidence refuses linked render path "${file}".`);
    if (entry.isDirectory()) output.push(...productionRepaintServicePhysicalFiles(file));
    else if (entry.isFile()) output.push(file);
  }
  return output;
};
