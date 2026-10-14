import type { Dirent } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { productionBinderCompareCodeUnits } from "./productionBinderCompareCodeUnits";
import { productionBinderToPosix } from "./productionBinderToPosix";

/**
 * Enumerate regular lowercase Markdown paths in global POSIX-relative code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation Recursive sorted enumeration rejects root/entry links, records regular lowercase .md relative paths and globally code-unit sorts the complete result. It uses metadata observations and does not establish continuing namespace identity.
 * @evidence contracts/common.md#clear-and-simple-design One flat inventory owner separates tree traversal from document bytes and final title/body transformation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Links refuse even when not Markdown candidates, while ordinary non-Markdown files are intentionally omitted; locale ordering never controls editions.
 * @evidence contracts/common.md#meaningful-documentation Defines exact suffix admission and global POSIX-relative order, distinguishing file inventory from current byte admission and later filesystem stability.
 * @evidence contracts/performance.md#efficient-algorithms Visits all E entries with per-directory sorting and final F-path O(F log F) sort, plus path conversion; recursion and suspended enumeration arrays grow with tree depth and sibling populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One result array accumulates every current path and supplies final ordering; overlapping calls do not share stale directory inventories.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns F pathname strings without a fixed cap; recursive async frames retain ancestor entry arrays until children finish, with no persistent watcher or retained inventory.
 */
export async function productionBinderListMarkdownFiles(root: string): Promise<string[]> {
    if ((await fs.lstat(root)).isSymbolicLink())
        throw new Error(`${root}: authored layers may not be links.`);
    const result: string[] = [];
    const walk: (directory: string) => Promise<void> = async (directory: string): Promise<void> => {
        const entries: Dirent[] = (await fs.readdir(directory, { withFileTypes: true })).sort((left: Dirent, right: Dirent): number => productionBinderCompareCodeUnits(left.name, right.name));
        for (const entry of entries) {
            const target: string = path.join(directory, entry.name);
            if (entry.isSymbolicLink())
                throw new Error(`${target}: authored layers may not contain links.`);
            if (entry.isDirectory())
                await walk(target);
            else if (entry.isFile() && entry.name.endsWith(".md"))
                result.push(productionBinderToPosix(path.relative(root, target)));
        }
    };
    await walk(root);
    return result.sort(productionBinderCompareCodeUnits);
}
