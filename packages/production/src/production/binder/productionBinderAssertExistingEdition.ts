import type { BigIntStats } from "node:fs";
import * as fs from "node:fs/promises";

/**
 * Admit an initially regular one-link existing edition only when its read text equals the intended Markdown.
 *
 * @evidence contracts/common.md#principled-implementation Initial bigint lstat must identify one nonlinked regular file with nlink one, then an opened descriptor's decoded UTF-8 text must equal the intended edition. Initial metadata and later open are separate observations rather than descriptor-bound namespace proof.
 * @evidence contracts/common.md#clear-and-simple-design Owns EEXIST convergence separately from the new-file publisher, using exact intended edition text instead of an output ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Different bytes, links, nonfiles and multiple links refuse; a matching pathname or title alone is never enough. A concurrent replacement between lstat/open is not prevented here.
 * @evidence contracts/common.md#meaningful-documentation States initial-entry checks, complete text comparison and propagated metadata/open/read/close errors; UTF-8 Buffer decoding is not strict malformed-byte admission.
 * @evidence contracts/performance.md#efficient-algorithms One metadata read and a full B-byte read/decode/string comparison drive time and buffers, with no directory or source-tree scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the caller's one rendered edition for comparison; each collision rereads the resident target rather than trusting an earlier successful publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The opened handle reaches finally close on equality or refusal, while close failure can replace the earlier error; returned success retains no resident bytes, descriptor or cache.
 */
export async function productionBinderAssertExistingEdition(target: string, markdown: string): Promise<void> {
    const linked: BigIntStats = await fs.lstat(target, { bigint: true });
    if (linked.isSymbolicLink() || !linked.isFile() || linked.nlink !== 1n)
        throw new Error(`${target}: an existing reader edition must be one unlinked regular file.`);
    const handle: fs.FileHandle = await fs.open(target, "r");
    try {
        if ((await handle.readFile("utf8")) !== markdown)
            throw new Error(`${target}: an existing reader edition has different bytes.`);
    }
    finally {
        await handle.close();
    }
}
