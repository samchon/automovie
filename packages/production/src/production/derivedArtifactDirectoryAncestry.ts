import path from "node:path";
import { derivedArtifactDirectoryIdentity } from "./derivedArtifactDirectoryIdentity";

/**
 * Each root-to-parent directory is recorded with its current bigint device/inode identity for publication rechecks.
 *
 * @evidence contracts/common.md#principled-implementation Each root-to-parent directory is recorded with its current bigint device/inode identity for publication rechecks.
 * @evidence contracts/common.md#clear-and-simple-design The atomic writer owns this attempt-local ancestry population and checks it around rename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty relative path retains the original repeated-root observation; no global identity lease or inode non-reuse certificate is added.
 * @evidence contracts/common.md#meaningful-documentation States borrowed path text and freshly acquired identity records used only by the current writer.
 * @evidence contracts/performance.md#efficient-algorithms Collects O(D) path records and stats each directory with accumulated path-text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Recorded identities are reused for this attempt's later comparison, not treated as a cross-attempt directory cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The ancestry array remains local to its writer and is released after success or failure; no handle is acquired.
 */
export const derivedArtifactDirectoryAncestry: (root: string, directory: string) => Array<{

    /** Absolute observed directory pathname whose recorded identity is checked during this write attempt. */
    path: string;

    /**
     * Observed bigint device/inode key used for the attempt's ancestry comparison.
     */
    identity: string;
}> = (root: string, directory: string): Array<{

    /** Absolute observed directory pathname whose recorded identity is checked during this write attempt. */
    path: string;

    /**
     * Observed bigint device/inode key used for the attempt's ancestry comparison.
     */
    identity: string;
}> => {
    const relative: string = path.relative(root, directory);
    const directories: string[] = [root];
    let current: string = root;
    for (const segment of relative.split(path.sep)) {
        current = path.join(current, segment);
        directories.push(current);
    }
    return directories.map((entry: string) : {
    path: string; identity: string } => ({
        path: entry,
        identity: derivedArtifactDirectoryIdentity(entry),
    }));
};
