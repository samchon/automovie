import { IAutoMovieScene } from "@automovie/interface";
import path from "node:path";
import { acquireOrCreateProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "../production/rootNamespaceLock";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { IAutoMovieLegacyActorSpec, IAutoMovieLegacyProjectSummary, IAutoMovieLegacyPropSpec, IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import { AUTOMOVIE_PROJECT_RESERVED_DIRS } from "./AUTOMOVIE_PROJECT_RESERVED_DIRS";
import { AutoMovieProjectRootError } from "./AutoMovieProjectRootError";
import { autoMovieProjectValidateManifest } from "./autoMovieProjectValidateManifest";
import { autoMovieProjectReadJson } from "./autoMovieProjectReadJson";
import { autoMovieProjectWriteJsonAtomic } from "./autoMovieProjectWriteJsonAtomic";
import { autoMovieProjectStoredSlate } from "./autoMovieProjectStoredSlate";
import { autoMovieProjectWritableSlate } from "./autoMovieProjectWritableSlate";
import { autoMovieProjectOrderResidentSlate } from "./autoMovieProjectOrderResidentSlate";
import { autoMovieProjectSaveSlate } from "./autoMovieProjectSaveSlate";
import { autoMovieProjectStageSlice } from "./autoMovieProjectStageSlice";
import { autoMovieProjectFlushBeatSlices } from "./autoMovieProjectFlushBeatSlices";
import { autoMovieProjectCommitCycle } from "./autoMovieProjectCommitCycle";
import { autoMovieProjectWithRootNamespace } from "./autoMovieProjectWithRootNamespace";
import { autoMovieProjectReadRevision } from "./autoMovieProjectReadRevision";
import { autoMovieProjectReadManifest } from "./autoMovieProjectReadManifest";
import { autoMovieProjectSynchronizeResidentState } from "./autoMovieProjectSynchronizeResidentState";
import { autoMovieProjectRevisionPath } from "./autoMovieProjectRevisionPath";
import { autoMovieProjectLockPath } from "./autoMovieProjectLockPath";
import { autoMovieProjectStoredProps } from "./autoMovieProjectStoredProps";
import { autoMovieProjectSaveProp } from "./autoMovieProjectSaveProp";
import { autoMovieProjectPropCaseCollision } from "./autoMovieProjectPropCaseCollision";
import { autoMovieProjectStoredActors } from "./autoMovieProjectStoredActors";
import { autoMovieProjectSaveActors } from "./autoMovieProjectSaveActors";
import { autoMovieProjectActorCaseCollision } from "./autoMovieProjectActorCaseCollision";
import { autoMovieProjectRemoveActor } from "./autoMovieProjectRemoveActor";
import { autoMovieProjectSliceCaseCollision } from "./autoMovieProjectSliceCaseCollision";
import { autoMovieProjectRemoveProp } from "./autoMovieProjectRemoveProp";
import { autoMovieProjectRegisterAsset } from "./autoMovieProjectRegisterAsset";
import { autoMovieProjectAssets } from "./autoMovieProjectAssets";
import { autoMovieProjectSummary } from "./autoMovieProjectSummary";
import { autoMovieProjectStaleRenders } from "./autoMovieProjectStaleRenders";
import { autoMovieProjectManifestPath } from "./autoMovieProjectManifestPath";
import { autoMovieProjectSlicePath } from "./autoMovieProjectSlicePath";
import { autoMovieProjectReadStagedScenes } from "./autoMovieProjectReadStagedScenes";
import { autoMovieProjectReadKeyedSlices } from "./autoMovieProjectReadKeyedSlices";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";
import type { IAutoMovieProductionRootNamespaceLease } from "../production/IAutoMovieProductionRootNamespaceLease";

/**
 *
 * @evidence contracts/common.md#principled-implementation The original project instance retains its root witnesses, manifest and clock; method adapters call source-preserved operations on that same instance.
 * @evidence contracts/common.md#clear-and-simple-design Keeps existing public names and state access timing; the internal forwarding view exposes real private accesses to TypeScript while oversized bodies remain in their owner files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only existing APIs remain; staging is not a multi-file transaction, namespace checks are finite and historical actor deep admission remains absent.
 * @evidence contracts/common.md#meaningful-documentation Documents optional slices, optimistic revision refusal and physical-root scopes; the actual maintained reach is legacy import's temporary clone, whose outer importer currently has no constructor consumer.
 * @evidence contracts/performance.md#efficient-algorithms Each adapter allocates one fixed-size forwarding view and calls its operation; nested adapters add their own views, while all byte reads, sorts, validators and mutation costs remain included.
 * @evidence contracts/performance.md#reuse-equivalent-work Each instance keeps its resident mirror, but reads and cycles renew current authority; there is no global project/result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Opening and operations attempt namespace retirement in finally; native cleanup can retain fences, callers retain the facade/mirror and failed mutations can leave published leaves or temporaries.
 */
export class AutoMovieProject {
/** Last admitted resident manifest mirror, replaced only at the original successful assignment points. */
private manifest: IAutoMovieProjectManifest;

/** Last successfully synchronized or published safe-integer clock used by optimistic mutation refusal. */
private lastReadRevision_: number;

/** Initialize reserved directories and the resident clock before creating or admitting the manifest under the factory's assertion scope; created paths can survive later failure. */
private constructor(/** Canonical root owning this resident legacy store. */ public readonly root: string, private readonly rootDevice: string, private readonly rootInode: string, assertNamespace: () => void) {
    for (const dir of AUTOMOVIE_PROJECT_RESERVED_DIRS) {
        assertNamespace();
        fileSystem.mkdirSync(path.join(root, dir), { recursive: true });
        assertNamespace();
    }
    this.lastReadRevision_ = this.readRevision();
    const existing: unknown = autoMovieProjectReadJson<unknown>(this.root, this.manifestPath);
    if (existing === null) {
        this.manifest = { version: 1, assets: [] };
        autoMovieProjectWriteJsonAtomic(this.manifestPath, this.manifest, assertNamespace);
    }
    else {
        this.manifest = autoMovieProjectValidateManifest(this.manifestPath, existing);
    }
}

/**
 *
 * @evidence contracts/common.md#principled-implementation Resolved root creation/acquisition supplies physical witnesses to the original private constructor; a closing assertion precedes return.
 * @evidence contracts/common.md#clear-and-simple-design Owns opening lease lifetime while constructor initialization preserves reserved-directory/revision/manifest order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Initialization can create paths before a later failure; existing manifests are admitted without rewriting their bytes.
 * @evidence contracts/common.md#meaningful-documentation States new-root initialization, absent slices and existing-manifest nonrewrite.
 * @evidence contracts/performance.md#efficient-algorithms Includes parent/root creation, reserved mkdir calls, revision/manifest reads and final identity/token checks.
 * @evidence contracts/performance.md#reuse-equivalent-work One acquired lease surrounds construction; independent opens are not cached or shared effectful initialization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts opening-lease retirement on return/throw; native cleanup can retain fences and created files/directories are not rolled back.
 */
public static open(rootDir: string): AutoMovieProject {
    const root: string = path.resolve(rootDir);
    const lease: IAutoMovieProductionRootNamespaceLease = ((): IAutoMovieProductionRootNamespaceLease => {
        try {
            return acquireOrCreateProductionRootNamespace(root);
        }
        catch (error) {
            const message: string = (error as Error).message;
            throw new AutoMovieProjectRootError(root, message ===
                `Production project root "${root}" is not a physical directory.`
                ? "project root must be a directory, not a symbolic link, junction, or file"
                : message);
        }
    })();
    try {
        const project: AutoMovieProject = new AutoMovieProject(lease.root, lease.device, lease.inode, (): void => assertProductionRootNamespaceLease(lease));
        assertProductionRootNamespaceLease(lease);
        return project;
    }
    finally {
        releaseProductionRootNamespace(lease);
    }
}

/**
 *
 * @evidence contracts/common.md#principled-implementation Root fencing and resident revision/manifest refresh precede keyed identity and semantic slice admission; optional absence stays null or empty.
 * @evidence contracts/common.md#clear-and-simple-design One resident read assembles script, scenes, shots, beat ends and notes; film admission is separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential observations are not an atomic snapshot; malformed present data refuses rather than becoming invented content.
 * @evidence contracts/common.md#meaningful-documentation States optional-state meaning, validated keyed identities and caller-owned collections.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files, sorts filenames and includes nested validators; output storage follows admitted content.
 * @evidence contracts/performance.md#reuse-equivalent-work Each file is parsed once in this assembly; current refreshes do not reuse pathname-only read verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts namespace retirement; failed native release can retain fences, while returned trees have no local byte/population cap.
 */
public storedSlate(): Omit<IAutoMovieLegacyWritableSlate, "film"> { return autoMovieProjectStoredSlate(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced stored-slate acquisition supplies the shot registry used to admit an optional film sequence.
 * @evidence contracts/common.md#clear-and-simple-design Film extends the acquired stored result rather than rebuilding the slate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nested checks preserve read order; film admission uses sequential shot observations rather than a frozen snapshot.
 * @evidence contracts/common.md#meaningful-documentation States nullable film and registry-dependent sequence refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes stored-slate I/O/validation, film bytes and sequence registry/entry scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The acquired shots are reused for film validation; each invocation still reobserves resident files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Nested namespace retirement is attempted before result transfer; native cleanup failure can retain fences under the existing void contract.
 */
public writableSlate(): IAutoMovieLegacyWritableSlate { return autoMovieProjectWritableSlate(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Copied shot and beat-end arrays sort by exact persisted filenames under code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design Aligns commit results with directory-read order without another disk read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Other fields and record references stay unchanged; filename encoding can throw on lone surrogates.
 * @evidence contracts/common.md#meaningful-documentation States fresh arrays, borrowed records and unchanged non-keyed slices.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and O(N log N) filename comparisons require N temporary references per population.
 * @evidence contracts/performance.md#reuse-equivalent-work Computed filenames serve this sort; no resident reads or cross-call cache occur.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh ordered arrays transfer to the caller; no handle or task is acquired.
 */
public orderResidentSlate(slate: IAutoMovieLegacyWritableSlate): IAutoMovieLegacyWritableSlate { return autoMovieProjectOrderResidentSlate(AutoMovieProject.forwardingView(this), slate); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Maps and case-folded filename guards precede serialization of every proposed slice; one guarded cycle then flushes them.
 * @evidence contracts/common.md#clear-and-simple-design Staging separates serialization from ordered mutations and historical scene-file removal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Staging failure writes nothing, but later flush failures can retain partial publication across leaves.
 * @evidence contracts/common.md#meaningful-documentation States reconciliation, stale-revision refusal, legacy scene migration and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Scans keyed records, stages B bytes, lists resident directories and writes/removes their complete populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged maps/text feed this cycle; equal output never bypasses current revision and namespace checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires on completion and lock retirement is attempted; failed cleanup can retain fences, and completed file mutations are not rolled back.
 */
public saveSlate(slate: IAutoMovieLegacyWritableSlate): void { return autoMovieProjectSaveSlate(AutoMovieProject.forwardingView(this), slate); }

/** Delegate on this unchanged instance to autoMovieProjectStageSlice; that owner documents the original effects, refusal order, costs and cleanup. */
private stageSlice(name: string, value: unknown): {
    file: string;
    content: string | null;
} { return autoMovieProjectStageSlice(AutoMovieProject.forwardingView(this), name, value); }

/** Delegate on this unchanged instance to autoMovieProjectFlushBeatSlices; that owner documents the original effects, refusal order, costs and cleanup. */
private flushBeatSlices(dir: string, staged: ReadonlyMap<string, string>, assertNamespace: () => void): void { return autoMovieProjectFlushBeatSlices(AutoMovieProject.forwardingView(this), dir, staged, assertNamespace); }

/** Delegate on this unchanged instance to autoMovieProjectCommitCycle; that owner documents the original effects, refusal order, costs and cleanup. */
private commitCycle(flush: (assertNamespace: () => void) => void): void { return autoMovieProjectCommitCycle(AutoMovieProject.forwardingView(this), flush); }

/** Delegate on this unchanged instance to autoMovieProjectWithRootNamespace; that owner documents the original effects, refusal order, costs and cleanup. */
private withRootNamespace<T>(task: (assertNamespace: () => void) => T): T { return autoMovieProjectWithRootNamespace(AutoMovieProject.forwardingView(this), task); }

/** Delegate on this unchanged instance to autoMovieProjectReadRevision; that owner documents the original effects, refusal order, costs and cleanup. */
private readRevision(): number { return autoMovieProjectReadRevision(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectReadManifest; that owner documents the original effects, refusal order, costs and cleanup. */
private readManifest(): IAutoMovieProjectManifest { return autoMovieProjectReadManifest(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectSynchronizeResidentState; that owner documents the original effects, refusal order, costs and cleanup. */
private synchronizeResidentState(): void { return autoMovieProjectSynchronizeResidentState(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectRevisionPath; that owner documents the original effects, refusal order, costs and cleanup. */
private get revisionPath(): string { return autoMovieProjectRevisionPath(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectLockPath; that owner documents the original effects, refusal order, costs and cleanup. */
private get lockPath(): string { return autoMovieProjectLockPath(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh precedes keyed correspondence and engine-backed validation of every stored prop.
 * @evidence contracts/common.md#clear-and-simple-design The directory reader owns identity while conversion/forge admission own nested semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bad keys or model/articulation semantics refuse instead of dropping or repairing props.
 * @evidence contracts/common.md#meaningful-documentation States filename order, fresh collection and validation refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes B bytes, F-name sorting and each prop gate's preliminary model check; admitted preliminary shapes add a second model check, driver/profile/part/mapping work and potentially O(J^2) joint parent walks, with no forge imported-appearance branch because lowering omits modelRef.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parsed record serves all checks; prior prop verdicts are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; native cleanup can retain fences and returned records have no local population cap.
 */
public storedProps(): IAutoMovieLegacyPropSpec[] { return autoMovieProjectStoredProps(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation An encoded node destination and serialized prop feed one revision-guarded leaf replacement.
 * @evidence contracts/common.md#clear-and-simple-design Upserts this prop while siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This low-level save performs no semantic or sibling case-collision admission.
 * @evidence contracts/common.md#meaningful-documentation States serialization-before-mutation, upsert scope and stale-clock refusal.
 * @evidence contracts/performance.md#efficient-algorithms Encodes node text and writes B serialized bytes plus concurrency checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text feeds publication; matching keys do not share effectful writes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock/temporary retirement is attempted only through their owners; native cleanup can retain fences/temporaries and renamed files can survive later refusal.
 */
public saveProp(spec: IAutoMovieLegacyPropSpec): void { return autoMovieProjectSaveProp(AutoMovieProject.forwardingView(this), spec); }

/**
 *
 * @evidence contracts/common.md#principled-implementation A fenced scan finds equal folded encoded filenames with different exact spelling and decodes the sibling.
 * @evidence contracts/common.md#clear-and-simple-design Uses the common keyed-directory collision owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact identity is an upsert; a query is no future write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling and malformed escape refusal.
 * @evidence contracts/performance.md#efficient-algorithms Scans up to F filenames with encoding/folding/decoding text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh names replace prior no-collision verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while the query returns only a nullable key.
 */
public propCaseCollision(node: string): string | null { return autoMovieProjectPropCaseCollision(AutoMovieProject.forwardingView(this), node); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh and filename/internal-node agreement return ordered actor records without deep context admission.
 * @evidence contracts/common.md#clear-and-simple-design Preserves historical actor storage while later semantic validation remains outside this reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsed contexts are not validity certificates; null records are skipped and key mismatch refuses.
 * @evidence contracts/common.md#meaningful-documentation States identity-only admission and remaining deep-validation gap.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files and sorts names, retaining the full parsed population.
 * @evidence contracts/performance.md#reuse-equivalent-work One current parse serves identity checks without an actor verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted, with possible retained fences after native failure; returned records have no local byte cap.
 */
public storedActors(): IAutoMovieLegacyActorSpec[] { return autoMovieProjectStoredActors(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation All actor filenames/text are staged before one guarded cycle writes selected members in input order.
 * @evidence contracts/common.md#clear-and-simple-design One revision increment surrounds upserts while unnamed siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization failure writes nothing; later leaf failure can retain earlier writes, with no added duplicate/case guard.
 * @evidence contracts/common.md#meaningful-documentation States selected-member upsert and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Stages N records/B bytes then performs N writes and one concurrency scope.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text is reused; equal ids never authorize shared effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires and safe lock/temporary retirement is attempted; cleanup can retain fences/temporaries and published actor files remain.
 */
public saveActors(specs: readonly IAutoMovieLegacyActorSpec[]): void { return autoMovieProjectSaveActors(AutoMovieProject.forwardingView(this), specs); }

/**
 *
 * @evidence contracts/common.md#principled-implementation The actors query shares fenced folded-filename comparison with props.
 * @evidence contracts/common.md#clear-and-simple-design Only the selected directory differs from the common owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact names remain ordinary matches; success is no later write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling node and decoding failure.
 * @evidence contracts/performance.md#efficient-algorithms Includes namespace acquisition and up to F filename/text comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call scans current actor names.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while a key/null transfers.
 */
public actorCaseCollision(node: string): string | null { return autoMovieProjectActorCaseCollision(AutoMovieProject.forwardingView(this), node); }

/**
 *
 * @evidence contracts/common.md#principled-implementation One encoded actor path is quarantined/removed inside a revision-guarded cycle.
 * @evidence contracts/common.md#clear-and-simple-design Removes one actor while siblings remain unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existence checks belong to callers; absence keeps the established cycle/revision behavior.
 * @evidence contracts/common.md#meaningful-documentation States selected-file scope and post-mutation refusal limits.
 * @evidence contracts/performance.md#efficient-algorithms Includes path text, concurrency checks and quarantine metadata without actor-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Current witnesses are renewed rather than reusing a prior deletion result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock retirement and safe rollback are attempted; failed native cleanup can retain fences or quarantine.
 */
public removeActor(node: string): void { return autoMovieProjectRemoveActor(AutoMovieProject.forwardingView(this), node); }

/** Delegate on this unchanged instance to autoMovieProjectSliceCaseCollision; that owner documents the original effects, refusal order, costs and cleanup. */
private sliceCaseCollision(dir: string, node: string): string | null { return autoMovieProjectSliceCaseCollision(AutoMovieProject.forwardingView(this), dir, node); }

/**
 *
 * @evidence contracts/common.md#principled-implementation An encoded prop filename uses the guarded quarantine remover.
 * @evidence contracts/common.md#clear-and-simple-design Deletes one prop without rewriting siblings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic admission or missing-file substitute is added.
 * @evidence contracts/common.md#meaningful-documentation States removal scope and cycle effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes encoding, concurrency checks and quarantine operations without prop-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work The current revision/namespace are reacquired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cycle token retirement is attempted and can retain fences after failure; quarantine cleanup/restoration belongs to the remover.
 */
public removeProp(node: string): void { return autoMovieProjectRemoveProp(AutoMovieProject.forwardingView(this), node); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Normalized path/current manifest admission precede optional no-existing-file publication, then manifest replacement and mirror assignment.
 * @evidence contracts/common.md#clear-and-simple-design One cycle coordinates asset registration and optional supplied bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No-byte registration verifies no existence; two writes are not a pair transaction and published bytes can survive manifest failure.
 * @evidence contracts/common.md#meaningful-documentation States duplicate refusal, host-written bytes, preserved extra fields and partial effects.
 * @evidence contracts/performance.md#efficient-algorithms Scans A keys, copies/serializes their manifest and optionally writes B bytes plus concurrency work.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh resident manifest supplies duplicate admission and update; stale mirrors are not authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the successful manifest; safe token/temporary cleanup is attempted but can retain fences/temporaries, while published bytes remain.
 */
public registerAsset(relativePath: string, bytes?: Uint8Array): string { return autoMovieProjectRegisterAsset(AutoMovieProject.forwardingView(this), relativePath, bytes); }

/**
 * Fenced refresh returns a copied asset-path array in registration order. Callers cannot edit the retained index through this getter.
 *
 * Registration proves neither binary existence nor unchanged bytes.
 *
 * Includes revision/manifest reads and A-reference copying. Current admitted mirror supplies the copy; old getter results are not current evidence.
 *
 * Namespace retirement is attempted and may retain fences on native failure; callers own the copy and the instance retains its mirror.
 */
public get assets(): string[] { return autoMovieProjectAssets(AutoMovieProject.forwardingView(this)); }

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced slate, prop/actor reads, stray discovery and asset acquisition assemble observations in the original order.
 * @evidence contracts/common.md#clear-and-simple-design Reports resident presence/keys without deleting strays or selecting production kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential nested reads are not one atomic filesystem snapshot.
 * @evidence contracts/common.md#meaningful-documentation States presence/count meaning and advisory stray paths.
 * @evidence contracts/performance.md#efficient-algorithms Includes repeated nested refreshes, all slice/prop validation and render-name scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The writable slate supplies presence and stem data; other original reads renew their own authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every acquired level has a retirement attempt, which can retain fences on native failure; summary arrays transfer and the instance retains its latest mirror.
 */
public summary(): IAutoMovieLegacyProjectSummary { return autoMovieProjectSummary(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectStaleRenders; that owner documents the original effects, refusal order, costs and cleanup. */
private staleRenders(slate: IAutoMovieLegacyWritableSlate): string[] { return autoMovieProjectStaleRenders(AutoMovieProject.forwardingView(this), slate); }

/** Delegate on this unchanged instance to autoMovieProjectManifestPath; that owner documents the original effects, refusal order, costs and cleanup. */
private get manifestPath(): string { return autoMovieProjectManifestPath(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectSlicePath; that owner documents the original effects, refusal order, costs and cleanup. */
private slicePath(name: string): string { return autoMovieProjectSlicePath(AutoMovieProject.forwardingView(this), name); }

/** Delegate on this unchanged instance to autoMovieProjectReadStagedScenes; that owner documents the original effects, refusal order, costs and cleanup. */
private readStagedScenes(): IAutoMovieScene[] { return autoMovieProjectReadStagedScenes(AutoMovieProject.forwardingView(this)); }

/** Delegate on this unchanged instance to autoMovieProjectReadKeyedSlices; that owner documents the original effects, refusal order, costs and cleanup. */
private readKeyedSlices<T>(dir: string, key: {
    /** Key role named by a filename/internal-identity mismatch. */
    label: string;

    /** Project the expected stored identity from this decoded filename key. */
    expected: (fileKey: string) => string;

    /** Read the actual internal identity from the parsed record; null/undefined remain mismatch values. */
    actual: (value: T) => string | null | undefined;
}, validate?: (file: string, value: T) => void): T[] { return autoMovieProjectReadKeyedSlices(AutoMovieProject.forwardingView(this), dir, key, validate); }

/**
 * Create the operation's typed access view without copying resident values. Getters/setters access the supplied instance lazily; method getters select and bind its current function before argument evaluation, preserving dynamic dispatch and receiver identity.
 *
 * The fixed member table makes the private accesses visible to TypeScript without dummy reads, public promotion or lint suppression. Construction reads no instance field or performs I/O, so detached this-free methods and pre-instance argument refusals retain their original behavior.
 *
 * Each adapter allocates one fixed accessor table; used method getters add bound functions and nested adapters allocate their own views. The indexed signature assertions preserve existing generic call relations erased by native bind's TypeScript inference.
 *
 * The view is call-local and has no retained cache or independent lease lifetime; forwarded operations remain responsible for bytes, locks and failure effects.
 */
private static forwardingView(project: AutoMovieProject): IAutoMovieProjectState {
return {
get root(): string { return project.root; },
get rootDevice(): string { return project.rootDevice; },
get rootInode(): string { return project.rootInode; },
get manifest(): IAutoMovieProjectManifest { return project.manifest; },
set manifest(value: IAutoMovieProjectManifest) { project.manifest = value; },
get lastReadRevision_(): number { return project.lastReadRevision_; },
set lastReadRevision_(value: number) { project.lastReadRevision_ = value; },
get storedSlate(): IAutoMovieProjectState["storedSlate"] { return project.storedSlate.bind(project) as IAutoMovieProjectState["storedSlate"]; },
get writableSlate(): IAutoMovieProjectState["writableSlate"] { return project.writableSlate.bind(project) as IAutoMovieProjectState["writableSlate"]; },
get orderResidentSlate(): IAutoMovieProjectState["orderResidentSlate"] { return project.orderResidentSlate.bind(project) as IAutoMovieProjectState["orderResidentSlate"]; },
get saveSlate(): IAutoMovieProjectState["saveSlate"] { return project.saveSlate.bind(project) as IAutoMovieProjectState["saveSlate"]; },
get stageSlice(): IAutoMovieProjectState["stageSlice"] { return project.stageSlice.bind(project) as IAutoMovieProjectState["stageSlice"]; },
get flushBeatSlices(): IAutoMovieProjectState["flushBeatSlices"] { return project.flushBeatSlices.bind(project) as IAutoMovieProjectState["flushBeatSlices"]; },
get commitCycle(): IAutoMovieProjectState["commitCycle"] { return project.commitCycle.bind(project) as IAutoMovieProjectState["commitCycle"]; },
get withRootNamespace(): IAutoMovieProjectState["withRootNamespace"] { return project.withRootNamespace.bind(project) as IAutoMovieProjectState["withRootNamespace"]; },
get readRevision(): IAutoMovieProjectState["readRevision"] { return project.readRevision.bind(project) as IAutoMovieProjectState["readRevision"]; },
get readManifest(): IAutoMovieProjectState["readManifest"] { return project.readManifest.bind(project) as IAutoMovieProjectState["readManifest"]; },
get synchronizeResidentState(): IAutoMovieProjectState["synchronizeResidentState"] { return project.synchronizeResidentState.bind(project) as IAutoMovieProjectState["synchronizeResidentState"]; },
get revisionPath(): string { return project.revisionPath; },
get lockPath(): string { return project.lockPath; },
get storedProps(): IAutoMovieProjectState["storedProps"] { return project.storedProps.bind(project) as IAutoMovieProjectState["storedProps"]; },
get saveProp(): IAutoMovieProjectState["saveProp"] { return project.saveProp.bind(project) as IAutoMovieProjectState["saveProp"]; },
get propCaseCollision(): IAutoMovieProjectState["propCaseCollision"] { return project.propCaseCollision.bind(project) as IAutoMovieProjectState["propCaseCollision"]; },
get storedActors(): IAutoMovieProjectState["storedActors"] { return project.storedActors.bind(project) as IAutoMovieProjectState["storedActors"]; },
get saveActors(): IAutoMovieProjectState["saveActors"] { return project.saveActors.bind(project) as IAutoMovieProjectState["saveActors"]; },
get actorCaseCollision(): IAutoMovieProjectState["actorCaseCollision"] { return project.actorCaseCollision.bind(project) as IAutoMovieProjectState["actorCaseCollision"]; },
get removeActor(): IAutoMovieProjectState["removeActor"] { return project.removeActor.bind(project) as IAutoMovieProjectState["removeActor"]; },
get sliceCaseCollision(): IAutoMovieProjectState["sliceCaseCollision"] { return project.sliceCaseCollision.bind(project) as IAutoMovieProjectState["sliceCaseCollision"]; },
get removeProp(): IAutoMovieProjectState["removeProp"] { return project.removeProp.bind(project) as IAutoMovieProjectState["removeProp"]; },
get registerAsset(): IAutoMovieProjectState["registerAsset"] { return project.registerAsset.bind(project) as IAutoMovieProjectState["registerAsset"]; },
get assets(): string[] { return project.assets; },
get summary(): IAutoMovieProjectState["summary"] { return project.summary.bind(project) as IAutoMovieProjectState["summary"]; },
get staleRenders(): IAutoMovieProjectState["staleRenders"] { return project.staleRenders.bind(project) as IAutoMovieProjectState["staleRenders"]; },
get manifestPath(): string { return project.manifestPath; },
get slicePath(): IAutoMovieProjectState["slicePath"] { return project.slicePath.bind(project) as IAutoMovieProjectState["slicePath"]; },
get readStagedScenes(): IAutoMovieProjectState["readStagedScenes"] { return project.readStagedScenes.bind(project) as IAutoMovieProjectState["readStagedScenes"]; },
get readKeyedSlices(): IAutoMovieProjectState["readKeyedSlices"] { return project.readKeyedSlices.bind(project) as IAutoMovieProjectState["readKeyedSlices"]; },
};
}
}
