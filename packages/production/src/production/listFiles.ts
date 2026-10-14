
import fs from "node:fs";
import path from "node:path";
import { compareCodeUnits } from "./contentIdentity";

/**
 * List regular files and symbolic-link entries in sorted directory traversal order.
 *
 * Each directory's entries use code-unit name order. lstat identifies links, which are returned instead of followed, and ordinary directories are recursively visited. Missing/inaccessible roots, disappearing entries and other filesystem errors propagate; this walker supplies no physical ancestry fence or atomic snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Reporting links lets generated ownership judge unsafe entries rather than hiding them. Production discovery/currentness consumers supply their selected root and own namespace/current-input admission; lstat does not eliminate races in ancestor replacement.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous walker serves generated inventory and resident document discovery; downstream owners interpret returned paths and refuse unsafe ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Links are visible as entries, not silently skipped or recursively followed by policy. No read error becomes an empty safe inventory, and concurrent external mutation remains outside a stable traversal guarantee.
 * @evidence contracts/common.md#meaningful-documentation Documents sorting, returned kinds, recursion, error propagation, root ownership and the non-atomic traversal limit.
 * @evidence contracts/performance.md#efficient-algorithms For E entries, readdir/lstat visits every entry and sorts each directory's K children in sum O(K log K) name comparisons; path construction adds text cost. Storage includes all returned paths plus current directory arrays and recursion depth, which is not capped.
 * @evidence contracts/performance.md#reuse-equivalent-work Each walk reobserves residency; a previous listing is not cached as current ownership. Entry metadata is used for this visit only and links are not revisited as target trees.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous fs APIs own their native handle lifetimes; returned path strings transfer to the caller. The walker starts no task and imposes no directory-depth or inventory-byte bound.
 */
export function listFiles(
  root: string
): string[] {
  const files: string[] = [];
  const visit: (directory: string) => void = (directory: string): void => {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left: fs.Dirent<string>, right: fs.Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
      const child: string = path.join(directory, entry.name);
      const status: fs.Stats = fs.lstatSync(child);
      if (status.isSymbolicLink()) files.push(child);
      else if (status.isDirectory()) visit(child);
      else if (status.isFile()) files.push(child);
    }
  };
  visit(root);
  return files;
}
