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
 * @evidence contracts/common.md#principled-implementation The facade supplies the acquired root identity; construction observes state roots, admits or issues incarnations, selects registration, performs any writable layout migration, captures namespace ancestry and finally admits layout/revision. Read-only opening refuses missing state rather than creating it.
 * @evidence contracts/common.md#clear-and-simple-design One instance groups opening identities and mutable observations while operation functions own reads, mutations and their currentness guards; the public facade owns its lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Opening applies the same physical-root fences and registration policy to every project; a later constructor refusal can leave earlier initialization writes or migration effects resident.
 * @evidence contracts/common.md#meaningful-documentation Properties distinguish physical identities, opening mode and mutable revision/manifest/deletion observations; the internal state adds no root-package API, and readonly fields do not freeze nested references.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete registry/JSON parsing, R-registration sorting and K retired-key membership scans, configured-directory and ancestry admission, and any E-entry legacy planning/M-move migration with its recovery costs; retained records/path text grow with those populations without a fixed cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Operations share opening identity expectations and revision observations but reacquire resident facts before using them. Each instance owns its mutable scalar fields and manifest wrapper; fixed-layout arrays and the supplied archetype catalogue can remain shared references.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains its state, manifest and D captured ancestor records until unreachable, with path text following captured depths and no new cap. Static factories own and attempt opening-lease cleanup, whose native failure can leave coordination entries; this state retains no descriptor or running task.
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

    /** Fixed ownership layout with descriptive project id and optional historical import metadata. */
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
     * Archetype catalogue used by design admission and the builder, retained by reference without a separate clone or freeze.
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
