import type { BigIntStats, Stats } from "node:fs";
import { readAutoMovieProductionProjectRevision as readRevision } from "./readAutoMovieProductionProjectRevision";
import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectDirectoryAncestry as IPhysicalDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import { IAutoMovieProductionManifest } from "@automovie/interface";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AUTOMOVIE_REGISTERED_ARCHETYPES, AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { IAutoMovieProductionRootNamespaceLease } from "./rootNamespaceLock";
import { productionProjectImportedLegacyOf } from "./productionProjectImportedLegacyOf";
import { productionProjectProjectLayoutLabel } from "./productionProjectProjectLayoutLabel";
import { productionProjectProductionDesignRootOf } from "./productionProjectProductionDesignRootOf";
import { productionProjectProjectLayout } from "./productionProjectProjectLayout";
import { productionProjectSharedDesignDirectories } from "./productionProjectSharedDesignDirectories";
import { productionProjectProductionDesignDirectories } from "./productionProjectProductionDesignDirectories";
import { productionProjectValidateRealOwnershipLayout } from "./productionProjectValidateRealOwnershipLayout";
import { productionProjectAcquirePhysicalDirectoryAncestry } from "./productionProjectAcquirePhysicalDirectoryAncestry";
import { productionProjectFileIdentityKey } from "./productionProjectFileIdentityKey";
import { productionProjectValidateIncarnation } from "./productionProjectValidateIncarnation";
import { productionProjectProjectIdOf } from "./productionProjectProjectIdOf";
import { productionProjectEncodeId } from "./productionProjectEncodeId";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectMkdirOwned } from "./productionProjectMkdirOwned";
import { productionProjectWriteOwnedJsonAtomic } from "./productionProjectWriteOwnedJsonAtomic";
import { productionProjectActivateProduction } from "./productionProjectActivateProduction";
import { productionProjectReadProductionRegistration } from "./productionProjectReadProductionRegistration";
import { productionProjectMigrateLegacyProductionLayout } from "./productionProjectMigrateLegacyProductionLayout";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";
import { productionProjectProductionNamespaceDirectories } from "./productionProjectProductionNamespaceDirectories";

/**
 * Mutable repository observations shared by one production project's operations.
 *
 * @evidence contracts/common.md#principled-implementation Copies the original project constructor's filesystem admission, incarnation, registration, layout migration and namespace observation order; read-only opening still refuses missing state rather than creating it.
 * @evidence contracts/common.md#clear-and-simple-design Holds one instance's fields while direct operation functions own their behavior, allowing the public facade to preserve its constructor and methods without a callback table or lazy binding cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Opening uses the same physical-root fences and production registration policy for every project; a constructor failure can leave already completed initialization writes, as before this mechanical split.
 * @evidence contracts/common.md#meaningful-documentation Properties distinguish physical namespace identities, immutable opening mode and mutable revision/manifest/deletion observations; the state is internal and its fields are not a new root-package API.
 * @evidence contracts/performance.md#efficient-algorithms Constructor work includes registration parsing, any required legacy migration, owned directory admission and captured ancestor lists; cost grows with registry/layout records and directory ancestry, rather than being a constant-size allocation alone.
 * @evidence contracts/performance.md#reuse-equivalent-work Operations share this opening's root/incarnation identities and last revision, but refresh and commit helpers reobserve resident state before relying on it; no state is shared between project objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state, its manifest and directory-ancestry arrays until unreachable; opening lease handles are owned and released by the static factories, and state retains no descriptor or running task.
 */
export class AutoMovieProductionProjectState {
    /**
     * Active production selected inside the project repository.
     */
    public readonly productionId: string;
    /** Physical root observed during opening, used by owned-file fences. */
    readonly rootReal: string;

    /** Decimal device identity of the host-selected root lease. */
    readonly rootDevice: string;

    /** Decimal inode identity of the host-selected root lease. */
    readonly rootInode: string;

    /** Reserved project-wide AutoMovie state directory. */
    readonly automovieRoot: string;

    /** Device/inode key observed for that reserved directory. */
    readonly automovieIdentity: string;

    /** Project incarnation record whose value distinguishes replaced state. */
    readonly incarnationPath: string;

    /** Project-wide registry of active production namespaces. */
    readonly registryPath: string;

    /** Encoded active production id used as one path segment. */
    readonly productionSegment: string;

    /** Active production's revision, claim and receipt storage directory. */
    readonly productionStateRoot: string;

    /** Tracked design directory dedicated to this production. */
    readonly productionDesignRoot: string;

    /** Tracked model and formation designs shared between productions. */
    readonly sharedDesignRoot: string;

    /** Active production's optimistic revision record. */
    readonly revisionPath: string;

    /** Active production's short mutation-lock path. */
    readonly lockPath: string;

    /** Project-wide lock used when mutating shared designs. */
    readonly sharedLockPath: string;

    /** Opening mode; mutating operations refuse when true. */
    readonly readOnly_: boolean;

    /** Whether opening first observed an absent registry. */
    readonly initialized_: boolean;

    /** Project incarnation admitted or created during opening. */
    readonly incarnation_: string;

    /** Registered incarnation of this production namespace. */
    readonly productionIncarnation_: string;

    /** Physical directory identities rechecked before relying on the namespace. */
    productionNamespaceAncestries_: readonly IPhysicalDirectoryAncestry[] = [];
    /** Current normalized layout including preserved unknown legacy fields. */
    manifest_: IAutoMovieProductionManifest & Record<string, unknown>;

    /** Most recently admitted resident revision, refreshed before public reads. */
    lastReadRevision_: number;

    /** Marks successful namespace erasure so subsequent operations refuse it. */
    deleted_: boolean = false;
    public constructor(
    /**
     * Canonical host-selected project root for this production repository.
     */
    public readonly root: string, rootIdentity: Pick<IAutoMovieProductionRootNamespaceLease, "device" | "inode">, requestedProductionId?: string, readOnly: boolean = false,
    /**
     * The archetype catalogue every design record in this project is judged
     * against, and the one its builder builds from.
     */
    public readonly archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES) {
        this.readOnly_ = readOnly;
        this.rootReal = fileSystem.realpathSync(root);
        this.rootDevice = rootIdentity.device;
        this.rootInode = rootIdentity.inode;
        this.automovieRoot = path.join(root, "automovie");
        this.incarnationPath = path.join(this.automovieRoot, "incarnation.json");
        this.registryPath = path.join(this.automovieRoot, "productions.json");
        const initialStateRoot: Stats | null = lstatOrNull(this.automovieRoot);
        if (initialStateRoot?.isSymbolicLink())
            throw new Error(`Reserved AutoMovie state root "${this.automovieRoot}" is a symlink or junction. Replace it with a physical project directory before opening the project.`);
        if (readOnly &&
            (initialStateRoot === null || initialStateRoot.isDirectory() === false))
            throw new Error(`Reserved AutoMovie state root "${this.automovieRoot}" is missing or not a directory. Open a complete physical project before read-only verification.`);
        if (readOnly === false)
            productionProjectMkdirOwned(this, this.automovieRoot);
        const stateIdentity: BigIntStats = fileSystem.statSync(this.automovieRoot, {
            bigint: true,
        });
        this.automovieIdentity = productionProjectFileIdentityKey(stateIdentity);
        const incarnation: unknown = readOwnedJson(this.rootReal, this.incarnationPath);
        if (incarnation === undefined) {
            if (readOnly)
                throw new Error(`Read-only verification requires existing state incarnation "${this.incarnationPath}". Run npm run build once to initialize the project.`);
            this.incarnation_ = randomUUID();
            productionProjectWriteOwnedJsonAtomic(this, this.incarnationPath, {
                version: 1,
                id: this.incarnation_,
            });
        }
        else
            this.incarnation_ = productionProjectValidateIncarnation(incarnation, this.incarnationPath);
        this.initialized_ =
            readOwnedJson(this.rootReal, this.registryPath) === undefined;
        this.manifest_ = {
            ...productionProjectProjectLayout,
            projectId: productionProjectProjectIdOf(root),
            ...productionProjectImportedLegacyOf(this.rootReal, this.automovieRoot),
        };
        const registration: { incarnation: string; legacy: boolean; productionId: string; } = readOnly
            ? productionProjectReadProductionRegistration(this, requestedProductionId)
            : productionProjectActivateProduction(this, requestedProductionId);
        this.productionId = registration.productionId;
        this.productionIncarnation_ = registration.incarnation;
        this.productionSegment = productionProjectEncodeId(this.productionId);
        this.productionStateRoot = path.join(this.automovieRoot, "productions", this.productionSegment);
        this.productionDesignRoot = productionProjectProductionDesignRootOf(root, this.productionId);
        this.sharedDesignRoot = path.join(this.automovieRoot, "design", "shared");
        this.revisionPath = path.join(this.productionStateRoot, "revision.json");
        this.lockPath = path.join(this.productionStateRoot, "revision.lock");
        this.sharedLockPath = path.join(this.automovieRoot, "shared-design.lock");
        if (readOnly === false) {
            if (registration.legacy)
                productionProjectMigrateLegacyProductionLayout(this);
            for (const directory of productionProjectSharedDesignDirectories)
                productionProjectMkdirOwned(this, path.join(this.sharedDesignRoot, directory));
            for (const directory of productionProjectProductionDesignDirectories)
                productionProjectMkdirOwned(this, path.join(this.productionDesignRoot, directory));
            productionProjectMkdirOwned(this, path.join(this.productionStateRoot, "render-receipts"));
            for (const directory of [
                ...this.manifest_.sourceRoots,
                this.manifest_.generatedRoot,
                this.manifest_.renderRoot,
            ])
                productionProjectMkdirOwned(this, productionProjectResolveOwnedDirectory(this, directory));
            productionProjectMkdirOwned(this, productionProjectGeneratedRoot(this));
            productionProjectMkdirOwned(this, productionProjectRenderRoot(this));
        }
        else
            for (const directory of [
                ...productionProjectProductionNamespaceDirectories(this),
                ...this.manifest_.sourceRoots.map((entry: string): string => productionProjectResolveOwnedDirectory(this, entry)),
            ])
                productionProjectAssertPhysicalDirectoryAncestors(this.rootReal, directory, false);
        this.productionNamespaceAncestries_ =
            productionProjectProductionNamespaceDirectories(this).map((directory: string): IPhysicalDirectoryAncestry => productionProjectAcquirePhysicalDirectoryAncestry(this.rootReal, directory));
        productionProjectValidateRealOwnershipLayout(this.rootReal, this.root, this.manifest_, productionProjectProjectLayoutLabel);
        this.lastReadRevision_ = readRevision(this.rootReal, this.revisionPath);
    }
}
