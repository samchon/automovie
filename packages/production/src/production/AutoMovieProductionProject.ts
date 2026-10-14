import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { readAutoMovieProductionProjectTypedJson as readOwnedTypedJson } from "./readAutoMovieProductionProjectTypedJson";
import { IAutoMovieProductionDesign } from "@automovie/interface";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AUTOMOVIE_REGISTERED_ARCHETYPES, AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { IAutoMovieProductionRootNamespaceLease, acquireOrCreateProductionRootNamespace, acquireProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "./rootNamespaceLock";
import { AutoMovieProductionProjectCapability9 } from "./AutoMovieProductionProjectCapability9";
import { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectProductionDesignRootOf } from "./productionProjectProductionDesignRootOf";
import { productionProjectValidateProductionDesign } from "./productionProjectValidateProductionDesign";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";

/**
 * Open one tracked production repository for design, build and publication operations.
 *
 * @evidence contracts/common.md#principled-implementation The private constructor initializes one state with the original filesystem ordering, while inherited public methods call their owning operation directly; static factories retain the same root lease checks before and after initialization.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the public class name, factory signatures and readonly root/productionId/archetypes own data properties; internal capability classes partition method adapters without introducing a host or changing the authored project schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No production or test receives a different state implementation; the split preserves supported calls, but it does not promise original prototype placement for unsupported reflection or JavaScript monkeypatching of private operations.
 * @evidence contracts/common.md#meaningful-documentation Static readers distinguish optional design absence from invalid present data and read-only refusal from writable initialization; individual inherited methods document their owning operation's effects.
 * @evidence contracts/performance.md#efficient-algorithms Delegated operations retain their filesystem, parsing, validation and media costs; adapters add one direct call, and creating a project adds one internal state object rather than rebuilding closure tables per invocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One facade shares its state across calls, with resident identity/revision observations rechecked by the operations that require them; factories create independent states and no global project cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Project state lives until the facade is unreachable; opening root leases are released in each factory's finally block even when initialization or its closing identity check throws, while committed files remain repository-owned.
 */
export class AutoMovieProductionProject extends AutoMovieProductionProjectCapability9 {
    /** Active production id selected by the admitted registry entry. */
    public readonly productionId: string;
    private constructor(
    /**
     * Canonical host-selected project root for this production repository.
     */
    public readonly root: string, rootIdentity: Pick<IAutoMovieProductionRootNamespaceLease, "device" | "inode">, requestedProductionId?: string, readOnly: boolean = false,
    /**
     * The archetype catalogue every design record in this project is judged
     * against, and the one its builder builds from.
     */
    public readonly archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES) {
        super(new AutoMovieProductionProjectState(root, rootIdentity, requestedProductionId, readOnly, archetypes));
        this.productionId = this.state_.productionId;
    }
    /**
     * Open or initialize one production inside a project repository.
     *
     * @evidence contracts/common.md#principled-implementation Resolves the selected root, refuses filesystem-root projects, acquires or creates its physical namespace lease, checks it before/after state initialization and returns only the final public class instance.
     * @evidence contracts/common.md#clear-and-simple-design The factory owns root selection/lease lifetime while state initialization owns registration, writable layout creation and migration; callers retain the existing open signature and archetype catalog option.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Initialization failure does not claim rollback of already created project paths, and no project-specific root bypass or alternate hidden host is selected.
     * @evidence contracts/common.md#meaningful-documentation Writable opening may initialize or migrate resident state and chooses an optional production id through existing registration policy, with physical root lease checks around construction.
     * @evidence contracts/performance.md#efficient-algorithms Includes root namespace acquisition, full state constructor work, possible registration/layout migration and final lease recheck; registry size, legacy records, path ancestry and created directories dominate rather than the factory's fixed number of statements.
     * @evidence contracts/performance.md#reuse-equivalent-work One acquired root lease is used across initialization and its closing identity check; each opening creates independent state and does not memoize initialization effects by root text.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The root lease is released in finally on successful return or any check/constructor failure; the returned project retains one state and committed initialization files remain repository-owned.
     */
    public static open(rootDirectory: string, productionId?: string, archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES): AutoMovieProductionProject {
        const root: string = path.resolve(rootDirectory);
        if (path.parse(root).root === root)
            throw new Error(`AutoMovie production root "${root}" is a filesystem root. Configure the host with a dedicated project directory.`);
        const lease: IAutoMovieProductionRootNamespaceLease = acquireOrCreateProductionRootNamespace(root);
        try {
            assertProductionRootNamespaceLease(lease);
            const project: AutoMovieProductionProject = new AutoMovieProductionProject(lease.root, lease, productionId, false, archetypes);
            assertProductionRootNamespaceLease(lease);
            return project;
        }
        finally {
            releaseProductionRootNamespace(lease);
        }
    }
    /**
     * Open one fully initialized production without creating, migrating, or
     * repairing any project-resident path.
     *
     * @evidence contracts/common.md#principled-implementation Resolves/refuses root-wide paths, acquires the existing physical root namespace, validates the lease around read-only state initialization and refuses missing or incompatible resident state rather than repairing it.
     * @evidence contracts/common.md#clear-and-simple-design Shares the same state schema and public class as writable open, with the explicit read-only flag selecting refusal and mutation prevention rather than a second project implementation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Read-only opening does not invoke writable activation, migration or mkdir; namespace lease bookkeeping is separate from creation/repair of project-resident records.
     * @evidence contracts/common.md#meaningful-documentation Requires a complete existing project/production and documents no resident path repair, while returned methods still reobserve physical identity and revisions rather than guaranteeing future immutability.
     * @evidence contracts/performance.md#efficient-algorithms Includes existing root acquisition, registry/incarnation/layout JSON admission and namespace ancestry capture plus final lease check; resident record bytes and path depth drive work without media rendering or migration.
     * @evidence contracts/performance.md#reuse-equivalent-work Uses one lease during this opening and shares admitted expectations inside the returned state; independent openings reacquire existing resident identities and records.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Finally releases the root lease after successful return or failure; one read-only state remains with the caller and no long-running lease, descriptor or watcher is retained by the project.
     */
    public static openReadOnly(rootDirectory: string, productionId?: string, archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES): AutoMovieProductionProject {
        const root: string = path.resolve(rootDirectory);
        if (path.parse(root).root === root)
            throw new Error(`AutoMovie production root "${root}" is a filesystem root. Configure the host with a dedicated project directory.`);
        const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(root);
        try {
            assertProductionRootNamespaceLease(lease);
            const project: AutoMovieProductionProject = new AutoMovieProductionProject(lease.root, lease, productionId, true, archetypes);
            assertProductionRootNamespaceLease(lease);
            return project;
        }
        finally {
            releaseProductionRootNamespace(lease);
        }
    }
    /**
     * Read one production's own design record without opening project state.
     *
     * The design record is where a production states the decisions it answers
     * for, so a consumer that needs one of them before anything has been opened
     * for writing asks the design rather than a second declaration beside it.
     * This reads exactly that one file under the same physical fence the project
     * reads it through, creates nothing, and takes no lock.
     *
     * A project that has emitted no design record has authored no such decision,
     * which is `null` rather than a fault: each reader of an optional decision
     * then falls back to its shipped default instead of inventing a value. A
     * resident record that does not validate is still an error, because a
     * decision nobody can read is not the same as a decision nobody made.
     *
     * @evidence contracts/common.md#principled-implementation Computes the root realpath and encoded production design path, then uses guarded typed JSON acquisition with the exact production schema; optional absence returns null and malformed present content refuses.
     * @evidence contracts/common.md#clear-and-simple-design Reads this one design decision without opening full project state, registration or a graph; consumers choosing optional defaults do not need a duplicate declaration file.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts This static read creates no record or project lease and does not prove graph linkage or freeze later resident content; physical ownership/schema failures propagate instead of becoming optional absence.
     * @evidence contracts/common.md#meaningful-documentation Documents read-only one-file behavior, optional null semantics, owned-file fencing and invalid present record distinction for pre-opening consumers.
     * @evidence contracts/performance.md#efficient-algorithms Includes id/path work, physical ancestry/descriptor checks and complete design JSON read/parse/schema traversal proportional to design bytes and nested entries, with no registry or other design scan.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work One optional decision is acquired for one consumer request; no cached result or watched revision establishes later byte/namespace equivalence.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded acquisition closes its descriptors and returned parsed design transfers to the caller; no project state, lock or running task is created.
     */
    public static productionDesign(rootDirectory: string, productionId: string): IAutoMovieProductionDesign | null {
        const root: string = path.resolve(rootDirectory);
        const rootReal: string = fileSystem.realpathSync(root);
        return readOwnedTypedJson(rootReal, path.join(productionProjectProductionDesignRootOf(root, productionId), "production.json"), productionProjectValidateProductionDesign);
    }
    /**
     * Read registered production ids without creating project state.
     *
     * @evidence contracts/common.md#principled-implementation Resolves the physical root, reads its owned tracked registry and validates portable ids before returning their normalized code-unit order; this does not require selecting an active production.
     * @evidence contracts/common.md#clear-and-simple-design Provides host discovery from existing registry data without initializing the project or constructing a second registry/index model.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/malformed registry data remains validator refusal, not an automatically empty or newly initialized project; a valid id list does not prove each production's resident generation current.
     * @evidence contracts/common.md#meaningful-documentation States existing-only registry discovery and sorted portable ids, distinguishing membership from successful openReadOnly admission of a selected namespace.
     * @evidence contracts/performance.md#efficient-algorithms Includes full registry read/parse and validation: P id encoding/map work, O(P log P) sorting, and potentially O(K*P) retired-incarnation membership work for K keys.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each discovery request reads the current owned registry rather than sharing an opening cache, so equal root text cannot suppress physical/file admission.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only the normalized id array transfers to the caller, guarded file reading closes its descriptors, and no project instance, lease or task is retained here.
     */
    public static registeredProductionIds(rootDirectory: string): string[] {
        const root: string = path.resolve(rootDirectory);
        const rootReal: string = fileSystem.realpathSync(root);
        const registryPath: string = path.join(rootReal, "automovie", "productions.json");
        return productionProjectValidateProductionRegistry(readOwnedJson(rootReal, registryPath), registryPath).productions;
    }
}
