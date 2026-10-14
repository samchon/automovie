import { IAutoMovieScene } from "@automovie/interface";
import { IAutoMovieLegacyActorSpec, IAutoMovieLegacyProjectSummary, IAutoMovieLegacyPropSpec, IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";

/**
 *
 * Internal lazy access view over one legacy project facade, exposing its root witnesses, mutable manifest/clock and existing operations to their owner functions. It copies no resident values, grants no runtime admission to arbitrary records and owns no independent namespace lease or cache.
 *
 * @evidence contracts/common.md#principled-implementation An internal structural view names the instance fields and method signatures forwarded by a call-local access object; it stores no copied resident values.
 * @evidence contracts/common.md#clear-and-simple-design Class-owned getters/setters and method forwarders access the same facade lazily, so its real private state stays encapsulated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The complete table is typed, with method-getter assertions preserving the original generic signatures after native bind; arbitrary externally supplied records receive no runtime admission.
 * @evidence contracts/common.md#meaningful-documentation Documents readonly root witnesses, mutable mirror/clock and direct method contracts; this view is not exported from the package root.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased view executes no operation; file reads, staging, validators and mutations remain with their named operation owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares no operation result; one actual project instance owns its mirror while current revision/namespace checks renew authority.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased contract retains nothing; each runtime forwarding view expires with its adapter call, the facade owns its mirror and operations own locks/resources.
 * @author Samchon
 */
export interface IAutoMovieProjectState {

/** Current canonical root data property, read by every resident path operation. */
readonly root: string;

/** Opening physical device witness compared with every later namespace acquisition. */
readonly rootDevice: string;

/** Opening physical inode witness compared with every later namespace acquisition. */
readonly rootInode: string;

/** Last admitted resident manifest mirror, replaced only at the original successful assignment points. */
manifest: IAutoMovieProjectManifest;

/** Last successfully synchronized or published safe-integer clock used by optimistic mutation refusal. */
lastReadRevision_: number;

/**
 *
 * Read current script, scenes, shots, beat ends and notes with keyed identity and field admission. Optional slices remain null or empty; callers own returned records and sequential reads do not establish one atomic snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Root fencing and resident revision/manifest refresh precede keyed identity and semantic slice admission; optional absence stays null or empty.
 * @evidence contracts/common.md#clear-and-simple-design One resident read assembles script, scenes, shots, beat ends and notes; film admission is separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential observations are not an atomic snapshot; malformed present data refuses rather than becoming invented content.
 * @evidence contracts/common.md#meaningful-documentation States optional-state meaning, validated keyed identities and caller-owned collections.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files, sorts filenames and includes nested validators; output storage follows admitted content.
 * @evidence contracts/performance.md#reuse-equivalent-work Each file is parsed once in this assembly; current refreshes do not reuse pathname-only read verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts namespace retirement; failed native release can retain fences, while returned trees have no local byte/population cap.
 */
storedSlate(): Omit<IAutoMovieLegacyWritableSlate, "film">;

/**
 *
 * Extend the acquired stored slate with nullable film admitted against its shot registry. Malformed present film refuses, while missing or parsed-null film remains null and records transfer to the caller.
 *
 * @evidence contracts/common.md#principled-implementation Fenced stored-slate acquisition supplies the shot registry used to admit an optional film sequence.
 * @evidence contracts/common.md#clear-and-simple-design Film extends the acquired stored result rather than rebuilding the slate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nested checks preserve read order; film admission uses sequential shot observations rather than a frozen snapshot.
 * @evidence contracts/common.md#meaningful-documentation States nullable film and registry-dependent sequence refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes stored-slate I/O/validation, film bytes and sequence registry/entry scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The acquired shots are reused for film validation; each invocation still reobserves resident files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Nested namespace retirement is attempted before result transfer; native cleanup failure can retain fences under the existing void contract.
 */
writableSlate(): IAutoMovieLegacyWritableSlate;

/**
 *
 * Return a shallow slate copy with newly ordered shot/beat-end arrays; records and other collections stay shared, and filename encoding can throw without file access.
 *
 * @evidence contracts/common.md#principled-implementation Copied shot and beat-end arrays sort by exact persisted filenames under code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design Aligns commit results with directory-read order without another disk read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Other fields and record references stay unchanged; filename encoding can throw on lone surrogates.
 * @evidence contracts/common.md#meaningful-documentation States fresh arrays, borrowed records and unchanged non-keyed slices.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and O(N log N) filename comparisons require N temporary references per population.
 * @evidence contracts/performance.md#reuse-equivalent-work Computed filenames serve this sort; no resident reads or cross-call cache occur.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh ordered arrays transfer to the caller; no handle or task is acquired.
 */
orderResidentSlate(slate: IAutoMovieLegacyWritableSlate): IAutoMovieLegacyWritableSlate;

/**
 *
 * Stage and reconcile complete slate slices in a revision-guarded cycle. Raw duplicate keys coalesce before case checks, semantic slate admission belongs elsewhere, and later failures can leave earlier published leaves.
 *
 * @evidence contracts/common.md#principled-implementation Maps and case-folded filename guards precede serialization of every proposed slice; one guarded cycle then flushes them.
 * @evidence contracts/common.md#clear-and-simple-design Staging separates serialization from ordered mutations and historical scene-file removal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Staging failure writes nothing, but later flush failures can retain partial publication across leaves.
 * @evidence contracts/common.md#meaningful-documentation States reconciliation, stale-revision refusal, legacy scene migration and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Scans keyed records, stages B bytes, lists resident directories and writes/removes their complete populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged maps/text feed this cycle; equal output never bypasses current revision and namespace checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires on completion and lock retirement is attempted; failed cleanup can retain fences, and completed file mutations are not rolled back.
 */
saveSlate(slate: IAutoMovieLegacyWritableSlate): void;

/**
 *
 * Return an absolute destination and caller-owned rendered content, with null as the removal sentinel; path construction and native serialization perform no file mutation here.
 *
 * @evidence contracts/common.md#principled-implementation Current root and fixed slice name identify the destination; null stages removal and other values use the shared JSON renderer.
 * @evidence contracts/common.md#clear-and-simple-design Keeps serialization before the guarded mutation phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization errors propagate before this helper touches files.
 * @evidence contracts/common.md#meaningful-documentation States absolute destination, null sentinel and owned rendered text.
 * @evidence contracts/performance.md#efficient-algorithms Path construction and full serialization scale with input/output text.
 * @evidence contracts/performance.md#reuse-equivalent-work One rendered string is reused during flush.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the staged record; no resource is acquired.
 */
stageSlice(name: string, value: unknown): {
    file: string;
    content: string | null;
};

/**
 *
 * Remove unstaged .json members before writing staged members in map order under namespace assertions; unrelated entries remain, while completed leaf effects are not rolled back as a group.
 *
 * @evidence contracts/common.md#principled-implementation A fenced directory scan removes .json names absent from staging before writing every staged member and reasserting ownership.
 * @evidence contracts/common.md#clear-and-simple-design One reconciler serves scenes, shots and beat ends in prescribed order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated entries remain; partial failures are not batch rollback.
 * @evidence contracts/common.md#meaningful-documentation States removal-before-write ordering and staged-map ownership.
 * @evidence contracts/performance.md#efficient-algorithms Lists F resident names and performs N writes over B bytes plus atomic-helper costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Pre-rendered map values are reused; directory membership is freshly observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Leaf helpers own temporaries; already completed mutations persist and no cache is retained here.
 */
flushBeatSlices(dir: string, staged: ReadonlyMap<string, string>, assertNamespace: () => void): void;

/**
 *
 * Admit a synchronous flush against the handle's current revision, then publish its safe successor. Stale state refreshes before refusal; later failures can retain mutation effects, and lock retirement is attempted in finally.
 *
 * @evidence contracts/common.md#principled-implementation Root/revision locks compare the last read clock, refresh stale state on refusal, then flush before safe-successor publication.
 * @evidence contracts/common.md#clear-and-simple-design Owns optimistic concurrency around the supplied synchronous mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale/exhausted checks precede flush; later failures can leave mutations without a refreshed instance clock.
 * @evidence contracts/common.md#meaningful-documentation States stale-state refresh, successor timing and token-release fallback without batch atomicity.
 * @evidence contracts/performance.md#efficient-algorithms Includes revision/manifest reads, lock admission and full callback work; byte/file costs have no local cap.
 * @evidence contracts/performance.md#reuse-equivalent-work One current clock selects its successor; prior mutation results cannot replace resident witnesses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts token retirement, using unlink=false after namespace failure; native cleanup can retain locks/backups and outer namespace retirement is separately attempted.
 */
commitCycle(flush: (assertNamespace: () => void) => void): void;

/**
 *
 * Run a synchronous callback between assertions of the opening physical root witnesses; final refusal does not undo callback effects, and finally attempts retirement only of this acquired namespace level.
 *
 * @evidence contracts/common.md#principled-implementation An existing root lease must match instance device/inode and remain valid before and after the synchronous callback.
 * @evidence contracts/common.md#clear-and-simple-design Supplies the repeated assertion closure shared by resident reads and mutations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite checks do not pin every future pathname or undo effects before a closing refusal.
 * @evidence contracts/common.md#meaningful-documentation States identity mismatch, result transfer and closing-fence effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes paired acquisition, current token/identity reads and full callback cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested scopes share exact lock depth; fresh assertions renew continuing authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts retirement of this acquired level; native cleanup can retain namespace fences, and independent callback resources remain callback-owned.
 */
withRootNamespace<T>(task: (assertNamespace: () => void) => T): T;

/**
 *
 * Read the non-negative safe-integer resident clock, using zero only for absent bytes; malformed present JSON or clock records throw rather than reset the revision.
 *
 * @evidence contracts/common.md#principled-implementation Optional owned bytes and strict JSON parsing feed the safe-integer decoder; only absence becomes zero.
 * @evidence contracts/common.md#clear-and-simple-design Separates physical/parser attribution from pure clock admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed present clocks are neither reset nor rounded.
 * @evidence contracts/common.md#meaningful-documentation States legacy zero, safe integer domain and malformed-file refusal.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses B bytes with ancestry/descriptor checks before fixed numeric work.
 * @evidence contracts/performance.md#reuse-equivalent-work Every refresh renews current clock evidence rather than reusing an earlier value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readers close descriptors; only a clock or attributed Error escapes.
 */
readRevision(): number;

/**
 *
 * Return the admitted resident version-one asset manifest, preserving extra fields; missing or parsed-null manifest refuses instead of recreating an existing store.
 *
 * @evidence contracts/common.md#principled-implementation Owned JSON acquisition precedes disappeared-manifest refusal and version/assets admission.
 * @evidence contracts/common.md#clear-and-simple-design Resident refresh and asset registration share this authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown fields are preserved; disappearance never creates a fresh empty existing-store manifest.
 * @evidence contracts/common.md#meaningful-documentation States admitted record ownership and malformed/missing refusal.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes and validates A paths using an A-entry uniqueness set.
 * @evidence contracts/performance.md#reuse-equivalent-work Current bytes replace stale retained mirrors as admission evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed records transfer to callers; file readers close descriptors.
 */
readManifest(): IAutoMovieProjectManifest;

/**
 *
 * Read revision then manifest before replacing either retained mirror field; read failures preserve old fields and the paired observations are not atomic.
 *
 * @evidence contracts/common.md#principled-implementation Revision is read before manifest; both fields update only after both reads succeed.
 * @evidence contracts/common.md#clear-and-simple-design Refreshes resident clock and asset mirror in one ordered operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential observations are not atomic; preassignment failure preserves old fields.
 * @evidence contracts/common.md#meaningful-documentation States observation and assignment order.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete revision/manifest reads and path admission.
 * @evidence contracts/performance.md#reuse-equivalent-work New observations replace old mirrors; equal revision does not suppress manifest reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the manifest until refresh/collection; readers close handles.
 */
synchronizeResidentState(): void;

/** Current project-root clock pathname; access alone opens no file. */
readonly revisionPath: string;

/** Current project-root mutation-lock pathname; token admission is separate. */
readonly lockPath: string;

/**
 *
 * Return fresh filename-ordered prop records after decoded node identity and legacy-to-engine validation; malformed present records refuse rather than being repaired or dropped.
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh precedes keyed correspondence and engine-backed validation of every stored prop.
 * @evidence contracts/common.md#clear-and-simple-design The directory reader owns identity while conversion/forge admission own nested semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bad keys or model/articulation semantics refuse instead of dropping or repairing props.
 * @evidence contracts/common.md#meaningful-documentation States filename order, fresh collection and validation refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes B bytes, F-name sorting and each prop gate's preliminary model check; admitted preliminary shapes add a second model check, driver/profile/part/mapping work and potentially O(J^2) joint parent walks, with no forge imported-appearance branch because lowering omits modelRef.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parsed record serves all checks; prior prop verdicts are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; native cleanup can retain fences and returned records have no local population cap.
 */
storedProps(): IAutoMovieLegacyPropSpec[];

/**
 *
 * Serialize and upsert one prop without semantic or sibling case admission; serialization precedes mutation, but a published leaf may survive later revision refusal.
 *
 * @evidence contracts/common.md#principled-implementation An encoded node destination and serialized prop feed one revision-guarded leaf replacement.
 * @evidence contracts/common.md#clear-and-simple-design Upserts this prop while siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This low-level save performs no semantic or sibling case-collision admission.
 * @evidence contracts/common.md#meaningful-documentation States serialization-before-mutation, upsert scope and stale-clock refusal.
 * @evidence contracts/performance.md#efficient-algorithms Encodes node text and writes B serialized bytes plus concurrency checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text feeds publication; matching keys do not share effectful writes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock/temporary retirement is attempted only through their owners; native cleanup can retain fences/temporaries and renamed files can survive later refusal.
 */
saveProp(spec: IAutoMovieLegacyPropSpec): void;

/**
 *
 * Return a differently spelled prop key with a colliding lowercase filename, or null; malformed filename escapes can throw and this observation grants no later write lease.
 *
 * @evidence contracts/common.md#principled-implementation A fenced scan finds equal folded encoded filenames with different exact spelling and decodes the sibling.
 * @evidence contracts/common.md#clear-and-simple-design Uses the common keyed-directory collision owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact identity is an upsert; a query is no future write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling and malformed escape refusal.
 * @evidence contracts/performance.md#efficient-algorithms Scans up to F filenames with encoding/folding/decoding text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh names replace prior no-collision verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while the query returns only a nullable key.
 */
propCaseCollision(node: string): string | null;

/**
 *
 * Return fresh filename-ordered actor records with matching stored node identities; parsed-null members are skipped and deep actor context admission remains external.
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh and filename/internal-node agreement return ordered actor records without deep context admission.
 * @evidence contracts/common.md#clear-and-simple-design Preserves historical actor storage while later semantic validation remains outside this reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsed contexts are not validity certificates; null records are skipped and key mismatch refuses.
 * @evidence contracts/common.md#meaningful-documentation States identity-only admission and remaining deep-validation gap.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files and sorts names, retaining the full parsed population.
 * @evidence contracts/performance.md#reuse-equivalent-work One current parse serves identity checks without an actor verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted, with possible retained fences after native failure; returned records have no local byte cap.
 */
storedActors(): IAutoMovieLegacyActorSpec[];

/**
 *
 * Stage all selected actors before upserting in input order, leaving unnamed siblings untouched; no semantic, duplicate or case gate is added and later failure may retain earlier writes.
 *
 * @evidence contracts/common.md#principled-implementation All actor filenames/text are staged before one guarded cycle writes selected members in input order.
 * @evidence contracts/common.md#clear-and-simple-design One revision increment surrounds upserts while unnamed siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization failure writes nothing; later leaf failure can retain earlier writes, with no added duplicate/case guard.
 * @evidence contracts/common.md#meaningful-documentation States selected-member upsert and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Stages N records/B bytes then performs N writes and one concurrency scope.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text is reused; equal ids never authorize shared effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires and safe lock/temporary retirement is attempted; cleanup can retain fences/temporaries and published actor files remain.
 */
saveActors(specs: readonly IAutoMovieLegacyActorSpec[]): void;

/**
 *
 * Return the first differently spelled actor key whose encoded filename collides under lowercase comparison, or null; decoding errors propagate and directory order is unsorted.
 *
 * @evidence contracts/common.md#principled-implementation The actors query shares fenced folded-filename comparison with props.
 * @evidence contracts/common.md#clear-and-simple-design Only the selected directory differs from the common owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact names remain ordinary matches; success is no later write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling node and decoding failure.
 * @evidence contracts/performance.md#efficient-algorithms Includes namespace acquisition and up to F filename/text comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call scans current actor names.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while a key/null transfers.
 */
actorCaseCollision(node: string): string | null;

/**
 *
 * Remove one actor leaf through the guarded quarantine path; missing leaves retain ordinary cycle/revision behavior, while later errors can retain deletion or failed-cleanup quarantine.
 *
 * @evidence contracts/common.md#principled-implementation One encoded actor path is quarantined/removed inside a revision-guarded cycle.
 * @evidence contracts/common.md#clear-and-simple-design Removes one actor while siblings remain unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existence checks belong to callers; absence keeps the established cycle/revision behavior.
 * @evidence contracts/common.md#meaningful-documentation States selected-file scope and post-mutation refusal limits.
 * @evidence contracts/performance.md#efficient-algorithms Includes path text, concurrency checks and quarantine metadata without actor-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Current witnesses are renewed rather than reusing a prior deletion result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock retirement and safe rollback are attempted; failed native cleanup can retain fences or quarantine.
 */
removeActor(node: string): void;

/**
 *
 * Scan one directory for the first differently spelled .json filename with the same lowercase encoded key, then decode that sibling or return null; this performs no content admission.
 *
 * @evidence contracts/common.md#principled-implementation Encoded target names fold to lowercase while exact spelling is excluded; the first matching sibling is decoded.
 * @evidence contracts/common.md#clear-and-simple-design Prop and actor queries share directory-name discovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Iteration chooses the first match without sorting; no semantic admission or write authority follows.
 * @evidence contracts/common.md#meaningful-documentation States first-match order, .json scope and decode/scan failures.
 * @evidence contracts/performance.md#efficient-algorithms Visits up to F names with folding and target encoding costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Current directory names are reobserved without caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a key/null escapes and no descriptor is retained.
 */
sliceCaseCollision(dir: string, node: string): string | null;

/**
 *
 * Remove one prop leaf in the ordinary guarded cycle without reading or validating its contents; completed deletion and failed-cleanup quarantine may survive later refusal.
 *
 * @evidence contracts/common.md#principled-implementation An encoded prop filename uses the guarded quarantine remover.
 * @evidence contracts/common.md#clear-and-simple-design Deletes one prop without rewriting siblings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic admission or missing-file substitute is added.
 * @evidence contracts/common.md#meaningful-documentation States removal scope and cycle effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes encoding, concurrency checks and quarantine operations without prop-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work The current revision/namespace are reacquired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cycle token retirement is attempted and can retain fences after failure; quarantine cleanup/restoration belongs to the remover.
 */
removeProp(node: string): void;

/**
 *
 * Register one normalized relative asset path and optionally publish supplied bytes at an absent destination; duplicate registration refuses, no-byte registration proves no file existence, and asset/manifest writes are not a pair transaction.
 *
 * @evidence contracts/common.md#principled-implementation Normalized path/current manifest admission precede optional no-existing-file publication, then manifest replacement and mirror assignment.
 * @evidence contracts/common.md#clear-and-simple-design One cycle coordinates asset registration and optional supplied bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No-byte registration verifies no existence; two writes are not a pair transaction and published bytes can survive manifest failure.
 * @evidence contracts/common.md#meaningful-documentation States duplicate refusal, host-written bytes, preserved extra fields and partial effects.
 * @evidence contracts/performance.md#efficient-algorithms Scans A keys, copies/serializes their manifest and optionally writes B bytes plus concurrency work.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh resident manifest supplies duplicate admission and update; stale mirrors are not authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the successful manifest; safe token/temporary cleanup is attempted but can retain fences/temporaries, while published bytes remain.
 */
registerAsset(relativePath: string, bytes?: Uint8Array): string;

/** Registered project-relative paths in registration order; registration alone proves no binary existence. */
readonly assets: string[];

/**
 *
 * Return slice-presence flags, ids/counts, registered paths and advisory render strays from sequential validated reads; this summary performs no deletion and proves no media acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Fenced slate, prop/actor reads, stray discovery and asset acquisition assemble observations in the original order.
 * @evidence contracts/common.md#clear-and-simple-design Reports resident presence/keys without deleting strays or selecting production kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential nested reads are not one atomic filesystem snapshot.
 * @evidence contracts/common.md#meaningful-documentation States presence/count meaning and advisory stray paths.
 * @evidence contracts/performance.md#efficient-algorithms Includes repeated nested refreshes, all slice/prop validation and render-name scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The writable slate supplies presence and stem data; other original reads renew their own authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every acquired level has a retirement attempt, which can retain fences on native failure; summary arrays transfer and the instance retains its latest mirror.
 */
summary(): IAutoMovieLegacyProjectSummary;

/**
 *
 * Return sorted top-level render paths outside film/shot filename stems and registered asset descendants; null film yields none, and filename membership is advisory policy rather than byte provenance.
 *
 * @evidence contracts/common.md#principled-implementation A committed film enables sorted-name filtering against film/shot stem families and registered descendant assets.
 * @evidence contracts/common.md#clear-and-simple-design Produces advisory paths without deleting rendered work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No film gives no deletion advice; stem membership is policy rather than byte provenance.
 * @evidence contracts/common.md#meaningful-documentation States top-level names, stem matching and asset exemptions.
 * @evidence contracts/performance.md#efficient-algorithms For R names/S stems/A assets, candidates scan stems/assets plus text costs and R-name sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Stems are built once but recopied per original predicate invocation; no persistent cache is added.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stray strings transfer; temporary names/sets expire and no deletion task starts.
 */
staleRenders(slate: IAutoMovieLegacyWritableSlate): string[];

/** Current project-root legacy manifest pathname; byte admission is separate. */
readonly manifestPath: string;

/**
 *
 * Join the current root with an internal fixed slice name without opening it; arbitrary name input receives no traversal or physical-identity admission from this helper.
 *
 * @evidence contracts/common.md#principled-implementation Native joining combines current root with the internal fixed slice name.
 * @evidence contracts/common.md#clear-and-simple-design Staging and optional reads share construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper admits no traversal/physical identity; actual callers supply fixed slice names.
 * @evidence contracts/common.md#meaningful-documentation States internal-name premise and destination.
 * @evidence contracts/performance.md#efficient-algorithms Joining costs proportional text work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current operands are used without a path table.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One pathname transfers; no handle opens.
 */
slicePath(name: string): string;

/**
 *
 * Prefer validated keyed scenes, falling back to a zero-or-one legacy scene.json list only when keyed output is empty; malformed keyed data refuses before fallback.
 *
 * @evidence contracts/common.md#principled-implementation Keyed scenes are admitted first; empty keyed output alone enables validated scene.json fallback.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the actual historical layout readable until saveSlate migration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed keyed content refuses instead of triggering fallback.
 * @evidence contracts/common.md#meaningful-documentation States keyed priority and legacy one-element projection.
 * @evidence contracts/performance.md#efficient-algorithms Reads/sorts/validates F scenes and conditionally one legacy file, including nested semantics.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the acquired keyed result directly; fallback bytes are read only when needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh records transfer; readers close handles and retain no snapshot cache.
 */
readStagedScenes(): IAutoMovieScene[];

/**
 *
 * Read sorted .json members, skip absence/parsed-null, and enforce decoded filename identity before optional caller validation; generic T and key matching alone do not establish a complete schema.
 *
 * @evidence contracts/common.md#principled-implementation Sorted .json names are parsed, URI-decoded and checked against supplied keys before optional validation.
 * @evidence contracts/common.md#clear-and-simple-design One directory reader serves scene, shot, beat-end, prop and actor storage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic T is no schema proof; parsed nulls are skipped and callers select deeper validation.
 * @evidence contracts/common.md#meaningful-documentation States callbacks, optional validator, order and key mismatch refusal.
 * @evidence contracts/performance.md#efficient-algorithms Lists/sorts F names, reads B bytes and includes every callback cost; trees scale with population.
 * @evidence contracts/performance.md#reuse-equivalent-work One parse feeds identity and semantic checks; no cross-read cache stands for current bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Callers own records; readers close descriptors and no local size cap exists.
 */
readKeyedSlices<T>(dir: string, key: {
    /** Key role named by a filename/internal-identity mismatch. */
    label: string;

    /** Project the expected stored identity from this decoded filename key. */
    expected: (fileKey: string) => string;

    /** Read the actual internal identity from the parsed record; null/undefined remain mismatch values. */
    actual: (value: T) => string | null | undefined;
}, validate?: (file: string, value: T) => void): T[];
}
