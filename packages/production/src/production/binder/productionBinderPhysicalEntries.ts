import type { Dirent, Stats } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Observe one physical directory and refuse symbolic entries before reader topology filtering.
 *
 * @evidence contracts/common.md#principled-implementation Initial lstat must identify a nonlinked directory, then readdir returns all entries and any symbolic entry refuses before topology filtering; these are sequential metadata observations.
 * @evidence contracts/common.md#clear-and-simple-design Shares one directory/entry boundary across group and unit readers, leaving accepted name profiles with their consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Even a symbolic entry whose name would later be ignored refuses; a metadata pass is not claimed to protect against later directory replacement.
 * @evidence contracts/common.md#meaningful-documentation Returns all observed Dirents only after directory/link checks, with native observation failures propagated.
 * @evidence contracts/performance.md#efficient-algorithms One lstat, E-entry readdir and linear link search cost O(E) entry storage and comparisons plus host latency; payload bytes are not read.
 * @evidence contracts/performance.md#reuse-equivalent-work The one returned entry population supplies both link admission and caller filtering without another enumeration here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the E Dirents; no descriptor, directory watcher or retained inventory survives in this helper.
 */
export async function productionBinderPhysicalEntries(directory: string): Promise<Dirent[]> {
    const linked: Stats = await fs.lstat(directory);
    if (linked.isSymbolicLink() || !linked.isDirectory())
        throw new Error(`${directory}: authored layers may not be links.`);
    const entries: Dirent[] = await fs.readdir(directory, { withFileTypes: true });
    const symbolic: Dirent | undefined = entries.find((entry: Dirent): boolean => entry.isSymbolicLink());
    if (symbolic !== undefined)
        throw new Error(`${path.join(directory, symbolic.name)}: authored layers may not contain links.`);
    return entries;
}
