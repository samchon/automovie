import type { Stats } from "node:fs";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactReadPhysicalFile } from "./derivedArtifactReadPhysicalFile";

/**
 * Actual absence is unequal; a present physically admitted file is compared byte-for-byte with the supplied output.
 *
 * @evidence contracts/common.md#principled-implementation Actual absence is unequal; a present physically admitted file is compared byte-for-byte with the supplied output.
 * @evidence contracts/common.md#clear-and-simple-design Generation skips replacement only when resident output or ledger bytes already match exactly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe resident files throw rather than count as ordinary different bytes or authorize replacement.
 * @evidence contracts/common.md#meaningful-documentation States absent-versus-unsafe distinction and exact equality, without locking nonparticipating filesystem writers.
 * @evidence contracts/performance.md#efficient-algorithms Reads B resident bytes and compares against O supplied bytes; Buffer conversions can allocate proportional copies.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied generated/serialized bytes are reused for comparison and later publication; resident bytes are freshly observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Comparison buffers expire after the boolean returns and no open handle is retained.
 */
export const derivedArtifactSameResidentBytes: (root: string, file: string, bytes: Uint8Array) => boolean = (root: string, file: string, bytes: Uint8Array): boolean => {
    const linked: Stats | null = derivedArtifactLstatOrNull(file);
    if (linked === null)
        return false;
    return Buffer.from(derivedArtifactReadPhysicalFile(root, file)).equals(Buffer.from(bytes));
};
