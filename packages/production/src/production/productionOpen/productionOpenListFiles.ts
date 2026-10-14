import fs, { type Dirent, type Stats } from "node:fs";

import path from "node:path";
import { compareCodeUnits } from "../contentIdentity";

/**
 * Enumerate existing root descendants in sorted DFS order without recursing through a final symlink.
 *
 * @evidence contracts/common.md#principled-implementation An absent root returns no paths; sorted readdir and lstat classify each child, recording linked entries as unsafe observations rather than following their descendants.
 * @evidence contracts/common.md#clear-and-simple-design Inspection uses this walker for generated and render populations; the builder's stricter missing-root walker is separate because its absence policy differs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential lstat/readdir observations do not establish a hostile-writer snapshot, and intermediate ancestor links are a caller-root premise.
 * @evidence contracts/common.md#meaningful-documentation Defines absent-root behavior, included regular/link paths and propagated native failures.
 * @evidence contracts/performance.md#efficient-algorithms Visits F entries and sorts each directory's child names; recursive call depth D and complete output paths contribute to memory, with no population or depth cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Each visited directory is listed once per walk; no prior pathname listing is reused after namespace changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Complete path lists transfer to inspection and per-directory arrays expire; recursion holds ancestor frames but no explicit descriptor or watcher is acquired.
 */
export const productionOpenListFiles: (root: string) => string[] = (root: string): string[] => {
    const output: string[] = [];
    const visit: (directory: string) => void = (directory: string): void => {
        if (fs.existsSync(directory) === false)
            return;
        for (const entry of fs
            .readdirSync(directory, { withFileTypes: true })
            .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
            const child: string = path.join(directory, entry.name);
            const status: Stats = fs.lstatSync(child);
            if (status.isSymbolicLink())
                output.push(child);
            else if (status.isDirectory())
                visit(child);
            else if (status.isFile())
                output.push(child);
        }
    };
    visit(root);
    return output;
};
