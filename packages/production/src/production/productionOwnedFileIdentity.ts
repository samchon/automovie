import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { BigIntStats } from "node:fs";

/**
 * Observe a nonlinked regular leaf's dev/ino identity.
 *
 * @evidence contracts/common.md#principled-implementation Bigint lstat rejects links/nonfiles before dev/NUL/ino token projection, relying on the supplied filesystem's native entry semantics.
 * @evidence contracts/common.md#clear-and-simple-design One leaf identity owner serves initial and later owned-reader fences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No payload is admitted by metadata alone, and unchanged inode identity is not proof against in-place mutation or ABA histories.
 * @evidence contracts/common.md#meaningful-documentation States regular-leaf/link refusal, opaque token and propagated native failures.
 * @evidence contracts/performance.md#efficient-algorithms One stat plus integer/text formatting; no file payload or child population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work One stat supplies both shape and token, but every later fence reobserves the entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string transfers; no descriptor, byte buffer or task is acquired.
 */
export function productionOwnedFileIdentity(file: string): string {
    const linked: BigIntStats = fileSystem.lstatSync(file, { bigint: true });
    if (linked.isSymbolicLink() || linked.isFile() === false)
        throw new Error(`Production-owned path "${file}" is not a physical file.`);
    return `${linked.dev}\0${linked.ino}`;
}
