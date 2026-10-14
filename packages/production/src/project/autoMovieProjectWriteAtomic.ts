import { randomUUID } from "node:crypto";
import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";

/**
 * Write supplied staged text/bytes to a same-directory temporary file and rename it over the selected leaf between namespace assertions. No fsync or group transaction is provided; a renamed leaf remains after a closing refusal. Before publication, finally attempts temporary removal only while namespace assertion permits touching it.
 *
 * @evidence contracts/common.md#principled-implementation Fenced directory creation and temporary write precede same-directory rename and a closing namespace assertion.
 * @evidence contracts/common.md#clear-and-simple-design Owns one leaf replacement while cycle ordering belongs to the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fsync or multi-file transaction is added; a renamed file persists after a closing refusal.
 * @evidence contracts/common.md#meaningful-documentation States cleanup only while namespace assertions permit touching the temporary path.
 * @evidence contracts/performance.md#efficient-algorithms Writes B bytes plus mkdir/rename/fence costs and one temporary file.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied staged text/bytes feed the write once; effectful calls are not shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Unpublished temporary removal is attempted; unsafe/failed cleanup can retain it, while published leaves remain.
 */
export const autoMovieProjectWriteAtomic: (file: string, data: Uint8Array | string, assertNamespace: () => void) => void = (file: string, data: Uint8Array | string, assertNamespace: () => void): void => {
    const temp: string = `${file}.tmp.${process.pid}.${randomUUID()}`;
    let published: boolean = false;
    try {
        assertNamespace();
        fileSystem.mkdirSync(path.dirname(file), { recursive: true });
        assertNamespace();
        fileSystem.writeFileSync(temp, data);
        assertNamespace();
        fileSystem.renameSync(temp, file);
        published = true;
        assertNamespace();
    }
    finally {
        if (published === false)
            try {
                assertNamespace();
                fileSystem.rmSync(temp, { force: true });
            }
            catch {
            }
    }
};
