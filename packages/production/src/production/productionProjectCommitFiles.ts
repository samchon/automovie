
import type { Stats } from "node:fs";
import { readAutoMovieProductionProjectRevision as readRevision } from "./readAutoMovieProductionProjectRevision";
import { requireAutoMovieProductionProjectNextRevision as requireNextRevision } from "./requireAutoMovieProductionProjectNextRevision";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectStagedFile as IStagedFile } from "./IAutoMovieProductionProjectStagedFile";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { runProductionMutation } from "./productionMutation";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { type IAutoMovieProductionRootNamespaceLease, acquireProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "./rootNamespaceLock";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectWriteAtomic } from "./productionProjectWriteAtomic";
import { productionProjectWriteAtomicImmutable } from "./productionProjectWriteAtomicImmutable";
import { productionProjectRemoveAtomic } from "./productionProjectRemoveAtomic";
import { productionProjectWriteJsonAtomic } from "./productionProjectWriteJsonAtomic";
import { productionProjectAssertRealAncestorInside } from "./productionProjectAssertRealAncestorInside";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectAssertWritable } from "./productionProjectAssertWritable";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";
import { productionProjectOwnerRootFor } from "./productionProjectOwnerRootFor";

/**
 * Stage and apply owned file mutations under namespace and optimistic revision fences.
 *
 * @evidence contracts/common.md#principled-implementation Acquires the root namespace lease, optional shared lock and production lock, compares resident revision, checks input currentness, stages detached new/previous bytes, and delegates ordered apply/restore/completion accounting to runProductionMutation before publishing the next safe generation.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates leases, paths, staging and revision policy; dedicated atomic helpers perform one filesystem step and mutation accounting determines rollback versus committed cleanup failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lazy staging runs only under the admitted locks, immutable publication uses exclusive creation, and incomplete rollback/cleanup is reported rather than hidden; empty-revision publication and shared locks follow explicit existing call options, not fixture-specific behavior.
 * @evidence contracts/common.md#meaningful-documentation Optional currentness callbacks run at their original pre/apply/completion boundaries; an empty staged set can retain the current revision when requested, while successful mutation publishes one next generation and post-commit failure need not mean rollback succeeded.
 * @evidence contracts/performance.md#efficient-algorithms Work includes repeated namespace/revision reads, per-file owner/ancestor checks, copies of all new and resident previous bytes, ordered atomic writes and possible restoration; file count, total byte volume, ancestry depth and callback work determine cost, with existing bounded contention retry adding requested waits.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains each staged file's previous bytes for restoration and uses one root lease/lock set within the transaction; namespace and input/output callbacks are rechecked instead of assuming equal paths or revisions prove equivalent resident content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Root lease and acquired production/shared locks are released through nested finally blocks; stale namespace cleanup releases process ownership without unlinking replacement lock paths, while staged current/previous buffers live until the attempt finishes and atomic helpers own temporary-file cleanup.
 */
export function productionProjectCommitFiles(state: AutoMovieProductionProjectState, files: readonly IStagedFile[] | (() => readonly IStagedFile[]), inputCurrent?: () => boolean, expectedRevision: number = state.lastReadRevision_, outputCurrent?: () => void, publishEmptyRevision: boolean = true, sharedMutation: boolean = false): number {
    productionProjectAssertWritable(state);
    const stage: (pending: readonly IStagedFile[]) => { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; }[] = (pending: readonly IStagedFile[]): { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; }[] => pending.map((file: IStagedFile): { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; } => ({
        path: file.path,
        immutable: file.immutable === true,
        content: file.content === null
            ? null
            : typeof file.content === "string"
                ? Buffer.from(file.content, "utf8")
                : Buffer.from(file.content),
        previous: ((): Buffer<ArrayBuffer> | null => {
            resolveInside(state.root, file.path);
            const ownerRoot: string = productionProjectOwnerRootFor(state, file.path);
            const ownerRootReal: string = productionProjectOwnedRootReal(state.rootReal, ownerRoot);
            productionProjectAssertRealAncestorInside(ownerRootReal, path.dirname(file.path));
            const linked: Stats | null = lstatOrNull(file.path);
            if (linked?.isSymbolicLink())
                throw new Error(`Owned target "${relativeToRoot(state.root, file.path)}" is a symlink or junction. Remove it before retrying the mutation.`);
            return linked === null
                ? null
                : Buffer.from(readAutoMovieProductionOwnedFile({
                    root: ownerRootReal,
                    directory: ownerRootReal,
                    relative: path.relative(ownerRoot, file.path),
                }));
        })(),
    }));
    const lazy: (() => readonly IStagedFile[]) | null = typeof files === "function" ? files : null;
    const eager: readonly IStagedFile[] | null = lazy === null ? (files as readonly IStagedFile[]) : null;
    const rootLease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(state.root, sharedMutation ? "@shared-design" : state.productionId);
    try {
        if (rootLease.device !== state.rootDevice ||
            rootLease.inode !== state.rootInode)
            throw new AutoMovieProductionInputRaceError("Production project root identity changed. Discard this project handle and open the physical project again before mutating it.");
        assertProductionRootNamespaceLease(rootLease);
        productionProjectAssertIncarnation(state);
        const sharedToken: string | null = sharedMutation
            ? acquireCommitLock(state.sharedLockPath)
            : null;
        let token: string;
        try {
            token = acquireCommitLock(state.lockPath);
        }
        catch (error) {
            if (sharedToken !== null)
                releaseCommitLock(state.sharedLockPath, sharedToken);
            throw error;
        }
        let lockBoundToIncarnation: boolean = false;
        try {
            assertProductionRootNamespaceLease(rootLease);
            productionProjectAssertIncarnation(state);
            lockBoundToIncarnation = true;
            const current: number = readRevision(state.rootReal, state.revisionPath);
            if (current !== expectedRevision)
                throw new AutoMovieProductionInputRaceError(`Production revision changed from ${expectedRevision} to ${current}. Inspect the project again before retrying the mutation.`);
            const nextRevision: number = requireNextRevision(current);
            if (inputCurrent?.() === false)
                throw new AutoMovieProductionInputRaceError("Production inputs changed before the guarded commit began.");
            assertProductionRootNamespaceLease(rootLease);
            productionProjectAssertIncarnation(state);
            const staged: { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; }[] = stage(eager ?? lazy!());
            assertProductionRootNamespaceLease(rootLease);
            productionProjectAssertIncarnation(state);
            const assertMutationNamespace: () => void = (): void => {
                assertProductionRootNamespaceLease(rootLease);
                productionProjectAssertIncarnation(state);
            };
            return runProductionMutation({
                files: staged,
                guard: assertMutationNamespace,
                apply: (file: { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; }, published: () => void): void => {
                    if (file.content === null)
                        productionProjectRemoveAtomic(file.path, published, assertMutationNamespace);
                    else if (file.immutable)
                        productionProjectWriteAtomicImmutable(file.path, file.content, assertMutationNamespace, published);
                    else
                        productionProjectWriteAtomic(file.path, file.content, assertMutationNamespace, published);
                },
                restore: (file: { path: string; immutable: boolean; content: Buffer<ArrayBuffer> | null; previous: Buffer<ArrayBuffer> | null; }): void => {
                    if (file.previous === null)
                        productionProjectRemoveAtomic(file.path, assertMutationNamespace, assertMutationNamespace);
                    else
                        productionProjectWriteAtomic(file.path, file.previous, assertMutationNamespace);
                },
                complete: (committed: () => void): number => {
                    if (inputCurrent?.() === false)
                        throw new AutoMovieProductionInputRaceError("Production inputs changed while the guarded commit was being applied.");
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    outputCurrent?.();
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    if (staged.length === 0 && publishEmptyRevision === false) {
                        state.lastReadRevision_ = current;
                        return current;
                    }
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    productionProjectWriteJsonAtomic(state.revisionPath, {
                        revision: nextRevision,
                    }, (): void => {
                        assertProductionRootNamespaceLease(rootLease);
                        productionProjectAssertIncarnation(state);
                    }, committed);
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    state.lastReadRevision_ = nextRevision;
                    return nextRevision;
                },
            });
        }
        finally {
            if (lockBoundToIncarnation === false)
                // Acquisition itself reached a replacement state root. The exact
                // owner token makes this resident cleanup safe; otherwise the new
                // namespace would inherit a permanent lock created by this attempt.
                releaseCommitLock(state.lockPath, token);
            else
                try {
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    releaseCommitLock(state.lockPath, token);
                }
                catch {
                    // Release only process-local ownership: never follow a stale
                    // revision-lock path into a replacement root or state incarnation.
                    releaseCommitLock(state.lockPath, token, { unlink: false });
                }
            if (sharedToken !== null)
                try {
                    assertProductionRootNamespaceLease(rootLease);
                    productionProjectAssertIncarnation(state);
                    releaseCommitLock(state.sharedLockPath, sharedToken);
                }
                catch {
                    releaseCommitLock(state.sharedLockPath, sharedToken, {
                        unlink: false,
                    });
                }
        }
    }
    finally {
        releaseProductionRootNamespace(rootLease);
    }
}
