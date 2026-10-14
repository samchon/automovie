import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { productionBinderAssertExistingEdition } from "./productionBinderAssertExistingEdition";
import { productionBinderHasErrorCode } from "./productionBinderHasErrorCode";

/**
 * Publish complete edition bytes into a new final slot or admit byte-identical existing output.
 *
 * @evidence contracts/common.md#principled-implementation An exclusive wx temporary receives complete UTF-8 bytes and sync before a hard link claims the final name; EEXIST alone delegates current regular-one-link/byte agreement admission. Inputs are caller-admitted output paths, and checks do not close all hostile namespace races.
 * @evidence contracts/common.md#clear-and-simple-design Owns one publication attempt while the existing-target reader owns convergence and the binder owns source/output separation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A different existing edition never gets overwritten; non-EEXIST failures propagate. Temporary names use process id and UUID without changing final deterministic edition bytes.
 * @evidence contracts/common.md#meaningful-documentation States no-clobber publication, byte-identical convergence, cleanup ordering and partial-failure limits; linking may have succeeded before temporary cleanup throws.
 * @evidence contracts/performance.md#efficient-algorithms Writes/syncs B UTF-8 bytes, creates one link, or reads/compares the full existing edition on collision; encoding and both edition representations contribute to storage rather than just fixed metadata work.
 * @evidence contracts/performance.md#reuse-equivalent-work The already rendered Markdown string supplies this attempt's write and collision comparison; no publication attempt is shared or memoized by target text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The acquired temporary FileHandle reaches finally close and the temporary pathname reaches outer finally removal; cleanup failure can mask the primary failure, and a linked final target is not rolled back. No successful close is promised after a native close error.
 */
export async function productionBinderPublishEdition(output: string, target: string, markdown: string): Promise<void> {
    const temporary: string = path.join(output, `.automovie-book-${process.pid}-${randomUUID()}.tmp`);
    try {
        const handle: fs.FileHandle = await fs.open(temporary, "wx");
        try {
            await handle.writeFile(markdown, "utf8");
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        await fs.link(temporary, target).catch(async (error: unknown): Promise<void> => {
            if (!productionBinderHasErrorCode(error, "EEXIST"))
                throw error;
            await productionBinderAssertExistingEdition(target, markdown);
        });
    }
    finally {
        await fs.rm(temporary, { force: true });
    }
}
