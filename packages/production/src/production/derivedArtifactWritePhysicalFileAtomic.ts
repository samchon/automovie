import { randomUUID } from "node:crypto";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { derivedArtifactEnsurePhysicalDirectory } from "./derivedArtifactEnsurePhysicalDirectory";
import { derivedArtifactAssertPhysicalLeaf } from "./derivedArtifactAssertPhysicalLeaf";
import { derivedArtifactDirectoryIdentity } from "./derivedArtifactDirectoryIdentity";
import { derivedArtifactDirectoryAncestry } from "./derivedArtifactDirectoryAncestry";
import { derivedArtifactAssertDirectoryAncestry } from "./derivedArtifactAssertDirectoryAncestry";

/**
 * A same-directory exclusive temporary is written, fsynced and closed before rename, with root and ancestor identities plus physical leaf checks bracketing publication.
 *
 * @evidence contracts/common.md#principled-implementation A same-directory exclusive temporary is written, fsynced and closed before rename, with root and ancestor identities plus physical leaf checks bracketing publication.
 * @evidence contracts/common.md#clear-and-simple-design Each output or manifest gets one atomic leaf replacement; the caller separately controls ordering across multiple files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity observations do not create a multi-file transaction or pin every pathname between calls; a failure after rename leaves the published leaf resident.
 * @evidence contracts/common.md#meaningful-documentation States exclusive temporary ownership, close-before-rename and unpublished-temporary cleanup; cleanup failure can replace an earlier error.
 * @evidence contracts/performance.md#efficient-algorithms Writes/fsyncs B bytes and observes D ancestors before/after rename; storage is one temporary file plus ancestry records and filesystem time is unbounded.
 * @evidence contracts/performance.md#reuse-equivalent-work Current ancestry snapshots are reused only within this one write attempt; the operation is effectful and not shared across callers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The descriptor closes in inner finally; outer finally removes an unpublished temporary. Successfully renamed files remain, including after a subsequent identity refusal.
 */
export const derivedArtifactWritePhysicalFileAtomic: (root: string, file: string, bytes: Uint8Array) => void = (root: string, file: string, bytes: Uint8Array): void => {
    derivedArtifactEnsurePhysicalDirectory(root, path.dirname(file));
    derivedArtifactAssertPhysicalLeaf(root, file);
    const rootIdentity: string = derivedArtifactDirectoryIdentity(root);
    const ancestry: Array<{
    path: string; identity: string }> = derivedArtifactDirectoryAncestry(root, path.dirname(file));
    const temporary: string = path.join(path.dirname(file), `.automovie-derived-${process.pid}-${randomUUID()}.tmp`);
    let published: boolean = false;
    try {
        const descriptor: number = fileSystem.openSync(temporary, "wx");
        try {
            fileSystem.writeFileSync(descriptor, bytes);
            fileSystem.fsyncSync(descriptor);
        }
        finally {
            fileSystem.closeSync(descriptor);
        }
        if (derivedArtifactDirectoryIdentity(root) !== rootIdentity)
            throw new Error("Physical project root changed during atomic publication.");
        derivedArtifactAssertDirectoryAncestry(ancestry);
        derivedArtifactAssertPhysicalLeaf(root, file);
        fileSystem.renameSync(temporary, file);
        published = true;
        derivedArtifactAssertDirectoryAncestry(ancestry);
        derivedArtifactAssertPhysicalLeaf(root, file);
    }
    finally {
        if (published === false)
            fileSystem.rmSync(temporary, { force: true });
    }
};
