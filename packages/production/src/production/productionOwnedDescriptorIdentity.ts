import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { BigIntStats } from "node:fs";

/**
 * Observe an open descriptor's regular-file dev/ino identity.
 *
 * @evidence contracts/common.md#principled-implementation Bigint fstat rejects nonregular descriptors before dev/NUL/ino token projection; descriptor acquisition and ownership remain with the reader.
 * @evidence contracts/common.md#clear-and-simple-design Primary and recheck descriptor fences use the same identity representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Descriptor identity does not independently prove current pathname ownership or stable content; those comparisons and limits stay with the reader.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed descriptor, regular-file refusal and returned opaque token.
 * @evidence contracts/performance.md#efficient-algorithms One native fstat and token formatting, without reading bytes or enumerating ancestors.
 * @evidence contracts/performance.md#reuse-equivalent-work The captured primary token serves later comparisons; newly opened recheck descriptors are observed independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The descriptor is borrowed and never closed here; its acquiring reader owns finally cleanup and any release failure.
 */
export function productionOwnedDescriptorIdentity(file: string, descriptor: number): string {
    const opened: BigIntStats = fileSystem.fstatSync(descriptor, { bigint: true });
    if (opened.isFile() === false)
        throw new Error(`Production-owned path "${file}" is not a physical file.`);
    return `${opened.dev}\0${opened.ino}`;
}
