import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { BigIntStats } from "node:fs";

/**
 * Observe a nonlinked directory's dev/ino identity.
 *
 * @evidence contracts/common.md#principled-implementation Bigint lstat rejects links and nondirectories before composing an opaque dev/NUL/ino token; actual filesystem capability owns native observation.
 * @evidence contracts/common.md#clear-and-simple-design The owned-file reader shares this identity representation for every ancestor fence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A token records one observation and cannot prevent replacement or prove complete bytes; no linked directory is intentionally followed.
 * @evidence contracts/common.md#meaningful-documentation Documents bigint token components, directory shape and propagated native/refusal.
 * @evidence contracts/performance.md#efficient-algorithms One native stat and integer-to-string construction, with time dominated by host latency and token text size.
 * @evidence contracts/performance.md#reuse-equivalent-work One observed stat supplies shape and identity; each endpoint comparison observes it afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the token transfers; this stat helper opens no descriptor or persistent watcher.
 */
export function productionOwnedDirectoryIdentity(directory: string): string {
    const linked: BigIntStats = fileSystem.lstatSync(directory, { bigint: true });
    if (linked.isSymbolicLink() || linked.isDirectory() === false)
        throw new Error(`Production-owned directory "${directory}" is not a physical directory.`);
    return `${linked.dev}\0${linked.ino}`;
}
