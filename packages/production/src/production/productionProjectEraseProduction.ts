import type { IAutoMovieProductionProjectDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";
import type { IAutoMovieProductionProjectProductionRegistry } from "./IAutoMovieProductionProjectProductionRegistry";

import type { Stats } from "node:fs";
import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectDirectoryAncestry as IPhysicalDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { type IAutoMovieProductionRootNamespaceLease, acquireProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "./rootNamespaceLock";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectWriteAtomic } from "./productionProjectWriteAtomic";
import { productionProjectPhysicalDirectoryIdentityOrNull } from "./productionProjectPhysicalDirectoryIdentityOrNull";
import { productionProjectAcquirePhysicalDirectoryAncestry } from "./productionProjectAcquirePhysicalDirectoryAncestry";
import { productionProjectAssertPhysicalDirectoryAncestry } from "./productionProjectAssertPhysicalDirectoryAncestry";
import { productionProjectFileIdentityKey } from "./productionProjectFileIdentityKey";
import { productionProjectDirectoryIdentityKey } from "./productionProjectDirectoryIdentityKey";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectMkdirOwned } from "./productionProjectMkdirOwned";
import { productionProjectAssertWritable } from "./productionProjectAssertWritable";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";
import { productionProjectAssertStateRootIdentity } from "./productionProjectAssertStateRootIdentity";

/**
 * Retire the active production registry entry and remove its owned namespaces.
 *
 * @evidence contracts/common.md#principled-implementation Writable/root/reason admission precedes the root lease and production lock; namespace entries move into an identity-fenced quarantine, audit publishes, then registry publication marks the handle deleted.
 * @evidence contracts/common.md#clear-and-simple-design Moved-entry records and an explicit registry commit flag separate reversible retirement from committed cleanup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement namespaces refuse stale rollback or cleanup; post-registry failure never restores the retired registration, and committed cleanup can still throw.
 * @evidence contracts/common.md#meaningful-documentation Returns erased ID and remaining registrations on completion; precommit rollback errors aggregate causes, while finally releases ownership even after a failed acknowledgement.
 * @evidence contracts/performance.md#efficient-algorithms Registry parsing/filtering, ancestry checks, a fixed three namespace moves and audit/registry writes precede recursive quarantine removal whose cost follows all retired entries.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured entry identities are rechecked through retirement/recovery; effectful moves and deletes are not shared by matching path names.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace lease releases in nested finally; lock release avoids unlinking a replacement state root. Committed quarantine cleanup may fail and leave recovery bytes, while uncommitted empty quarantine cleanup is best effort.
 */
export function productionProjectEraseProduction(_project: AutoMovieProductionProjectState, reason: string): {
    erased: boolean;
    productionId: string;
    remaining: string[];
} {
    productionProjectAssertWritable(_project);
    // A handle whose production was already erased refuses here, before any
    // lease or lock, instead of failing its own identity fence later.
    productionProjectAssertProjectRootIdentity(_project);
    if (reason.trim().length === 0)
        throw new Error("Production erase audit reason must not be blank.");
    const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(_project.root);
    let token: string | null = null;
    const quarantine: string = path.join(_project.automovieRoot, `.erase-${_project.productionSegment}-${randomUUID()}`);
    const moved: Array<{
        from: string;
        to: string;
        identity: string;
    }> = [];
    const auditPath: string = path.join(_project.automovieRoot, "audit", "production-deletions", `${_project.productionSegment}-${randomUUID()}.json`);
    let erased: boolean = false;
    let registryPublished: boolean = false;
    let remaining: string[] = [];
    let quarantineAncestry: IPhysicalDirectoryAncestry | null = null;
    let auditParentAncestry: IPhysicalDirectoryAncestry | null = null;
    let sourceParentAncestries: readonly IPhysicalDirectoryAncestry[] = [];
    let auditIdentity: string | null = null;
    let productionStateIdentity: string | null = null;
    const committedErase: {
        fence: {
            quarantine: IPhysicalDirectoryAncestry;
            state: string;
        } | null;
    } = { fence: null };
    const assertResidentEntry: (file: string, identity: string) => void = (file: string, identity: string): void => {
        productionProjectAssertPhysicalDirectoryAncestors(_project.rootReal, path.dirname(file), false);
        const linked: Stats | null = lstatOrNull(file);
        if (linked === null ||
            linked.isSymbolicLink() ||
            productionProjectFileIdentityKey(fileSystem.statSync(file, { bigint: true })) !==
                identity)
            throw new AutoMovieProductionInputRaceError(`Production erase entry "${file}" changed physical identity. No stale-path cleanup may touch its replacement.`);
    };
    const assertEraseFence: () => void = (): void => {
        assertProductionRootNamespaceLease(lease);
        productionProjectAssertProjectRootIdentity(_project);
        productionProjectAssertStateRootIdentity(_project);
        if (quarantineAncestry !== null)
            productionProjectAssertPhysicalDirectoryAncestry(quarantineAncestry);
        if (auditParentAncestry !== null)
            productionProjectAssertPhysicalDirectoryAncestry(auditParentAncestry);
        for (const ancestry of sourceParentAncestries)
            productionProjectAssertPhysicalDirectoryAncestry(ancestry);
    };
    const markErased: (fence: NonNullable<{ quarantine: IPhysicalDirectoryAncestry; state: string; } | null>) => NonNullable<{ quarantine: IPhysicalDirectoryAncestry; state: string; } | null> = (fence: NonNullable<(typeof committedErase)["fence"]>): NonNullable<(typeof committedErase)["fence"]> => {
        _project.deleted_ = true;
        erased = true;
        return fence;
    };
    try {
        // The state identity is read before the lock is taken, so a refusal at
        // any later step still knows the lock file sits in its own state root
        // and can unlink it instead of leaving a lock this process cannot retake.
        const residentStateIdentity: string = productionProjectFileIdentityKey(fileSystem.statSync(_project.productionStateRoot, { bigint: true }));
        productionStateIdentity = residentStateIdentity;
        token = acquireCommitLock(_project.lockPath);
        assertProductionRootNamespaceLease(lease);
        productionProjectAssertIncarnation(_project);
        const registry: IAutoMovieProductionProjectProductionRegistry = productionProjectValidateProductionRegistry(readOwnedJson(_project.rootReal, _project.registryPath), _project.registryPath);
        const sources: string[] = [
            _project.productionDesignRoot,
            productionProjectGeneratedRoot(_project),
            productionProjectRenderRoot(_project),
        ];
        productionProjectMkdirOwned(_project, quarantine);
        const residentQuarantineAncestry: IPhysicalDirectoryAncestry = productionProjectAcquirePhysicalDirectoryAncestry(_project.rootReal, quarantine);
        quarantineAncestry = residentQuarantineAncestry;
        const residentEraseFence: { quarantine: IPhysicalDirectoryAncestry; state: string; } = {
            quarantine: residentQuarantineAncestry,
            state: residentStateIdentity,
        };
        productionProjectMkdirOwned(_project, path.dirname(auditPath));
        auditParentAncestry = productionProjectAcquirePhysicalDirectoryAncestry(_project.rootReal, path.dirname(auditPath));
        sourceParentAncestries = sources.map((source: string): IPhysicalDirectoryAncestry => productionProjectAcquirePhysicalDirectoryAncestry(_project.rootReal, path.dirname(source)));
        for (const source of sources) {
            assertEraseFence();
            const state: Stats | null = lstatOrNull(source);
            if (state === null)
                continue;
            if (state.isSymbolicLink())
                throw new Error(`Production erase refused unsafe namespace "${source}". Replace links and reopen before retrying.`);
            const identity: string = productionProjectFileIdentityKey(fileSystem.statSync(source, { bigint: true }));
            const destination: string = path.join(quarantine, String(moved.length).padStart(2, "0"));
            fileSystem.renameSync(source, destination);
            assertResidentEntry(destination, identity);
            moved.push({ from: source, to: destination, identity });
        }
        remaining = registry.productions.filter((production: string): boolean => production !== _project.productionId);
        productionProjectWriteAtomic(auditPath, Buffer.from(productionProjectSerializeJson({
            version: 1,
            productionId: _project.productionId,
            reason: reason.trim(),
        }), "utf8"), assertEraseFence, (): void => {
            auditIdentity = productionProjectFileIdentityKey(fileSystem.statSync(auditPath, { bigint: true }));
        });
        productionProjectWriteAtomic(_project.registryPath, Buffer.from(productionProjectSerializeJson({
            ...registry,
            productions: remaining,
        }), "utf8"), assertEraseFence, (): void => {
            registryPublished = true;
            committedErase.fence = markErased(residentEraseFence);
        });
    }
    catch (error) {
        if (registryPublished === false) {
            try {
                assertEraseFence();
                for (const entry of moved)
                    assertResidentEntry(entry.to, entry.identity);
                if (auditIdentity !== null)
                    assertResidentEntry(auditPath, auditIdentity);
            }
            catch (identityError) {
                throw new AggregateError([error, identityError], "Production erase stopped after an owned namespace changed physical identity. No stale-path rollback was attempted.");
            }
            const rollbackErrors: unknown[] = [];
            for (const entry of [...moved].reverse())
                try {
                    assertEraseFence();
                    assertResidentEntry(entry.to, entry.identity);
                    if (lstatOrNull(entry.from) !== null)
                        throw new AutoMovieProductionInputRaceError(`Production erase source "${entry.from}" was replaced before rollback. The quarantined original was left untouched.`);
                    productionProjectMkdirOwned(_project, path.dirname(entry.from));
                    fileSystem.renameSync(entry.to, entry.from);
                    assertResidentEntry(entry.from, entry.identity);
                }
                catch (rollbackError) {
                    rollbackErrors.push(rollbackError);
                }
            if (auditIdentity !== null)
                try {
                    assertEraseFence();
                    assertResidentEntry(auditPath, auditIdentity);
                    fileSystem.rmSync(auditPath);
                }
                catch (rollbackError) {
                    rollbackErrors.push(rollbackError);
                }
            if (rollbackErrors.length !== 0)
                throw new AggregateError([error, ...rollbackErrors], "Production erase failed and identity-fenced rollback was incomplete. Restore only the listed quarantined originals before retrying.");
            throw error;
        }
    }
    finally {
        try {
            if (token !== null) {
                const state: IAutoMovieProductionProjectDirectoryIdentity | null = productionProjectPhysicalDirectoryIdentityOrNull(_project.productionStateRoot);
                if (productionStateIdentity !== null &&
                    state !== null &&
                    productionProjectDirectoryIdentityKey(state) === productionStateIdentity)
                    releaseCommitLock(_project.lockPath, token);
                else
                    releaseCommitLock(_project.lockPath, token, { unlink: false });
            }
            if (committedErase.fence !== null) {
                productionProjectAssertPhysicalDirectoryAncestry(committedErase.fence.quarantine);
                for (const entry of moved)
                    assertResidentEntry(entry.to, entry.identity);
                assertResidentEntry(_project.productionStateRoot, committedErase.fence.state);
                const stateDestination: string = path.join(quarantine, "state");
                fileSystem.renameSync(_project.productionStateRoot, stateDestination);
                assertResidentEntry(stateDestination, committedErase.fence.state);
                fileSystem.rmSync(quarantine, { force: true, recursive: true });
            }
            else if (registryPublished === false && quarantineAncestry !== null)
                try {
                    productionProjectAssertPhysicalDirectoryAncestry(quarantineAncestry);
                    if (fileSystem.readdirSync(quarantine).length === 0)
                        fileSystem.rmdirSync(quarantine);
                }
                catch {
                    // A replacement quarantine is not ours to inspect or remove.
                }
        }
        finally {
            releaseProductionRootNamespace(lease);
        }
    }
    return {
        erased,
        productionId: _project.productionId,
        remaining,
    };
}
