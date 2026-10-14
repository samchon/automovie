import { IAutoMovieGeneratedManifest } from "@automovie/interface";
import { AutoMovieProductionProjectCapability3 } from "./AutoMovieProductionProjectCapability3";
import { productionProjectResolveSourcePath } from "./productionProjectResolveSourcePath";
import { productionProjectGeneratedManifest } from "./productionProjectGeneratedManifest";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectTrackedStatePath } from "./productionProjectTrackedStatePath";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectReadGeneratedFile } from "./productionProjectReadGeneratedFile";

/**
 * Preserve the public project method group 4 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This base adds no per-instance handles, buffers, closure tables or tasks to the state retained by the first base; individual operations own acquisition and cleanup attempts, with close failures still observable rather than proof of host release.
 */
export class AutoMovieProductionProjectCapability4 extends AutoMovieProductionProjectCapability3 {
    /**
     * Resolve a project-relative source module address under configured roots and the four supported TypeScript suffixes.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectResolveSourcePath with the instance's state. Project-root identity is checked before absolute-path and native lexical escape refusal; configured-root containment precedes exact .ts/.tsx/.mts/.cts suffix membership and returns the resolved address without reading a target.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This operation owns source address and suffix policy, while readSource separately observes target presence/realpath and guarded bytes and build owners execute admitted modules.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported suffixes and outside-root addresses have no fallback; configured-root resolution does not itself prove final root directory kind, target existence or absence of a later alias/race.
     * @evidence contracts/common.md#meaningful-documentation Defines relative-only addressing, root-inclusive native containment, supported case-sensitive suffixes and typed outside-root versus generic suffix refusal; the result is an absolute path, not admitted source bytes.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Native path work scales with address text and up to S configured-root resolution/realpath checks, including each delegated project-root observation; the fixed four-suffix membership performs no filesystem inventory.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested address obtains current root observations and no previous resolved path is retained as proof of target ownership or byte equivalence.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Only the resolved pathname escapes; path/stat temporaries expire locally and no file descriptor, module, payload buffer or running task is acquired.
     */
    public resolveSourcePath(relativePath: string): string {
        return productionProjectResolveSourcePath(this.state_, relativePath);
    }
    /**
     * Read the admitted generated manifest, or null for optional record absence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectGeneratedManifest with the instance's state. Refreshes the production namespace/revision then delegates owned-file JSON schema admission to loadGeneratedManifest; absent and malformed present records remain distinct.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Separates currentness coordination from the generated manifest path/schema reader and preserves the facade's optional return shape.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not rebuild generated output or return a cached manifest after read failure; manifest schema validity alone does not prove every generated artifact's bytes.
     * @evidence contracts/common.md#meaningful-documentation Null means the optional tracked manifest is absent, while successful data is a typed current read requiring separate generated artifact identity checks.
     * @evidence contracts/performance.md#efficient-algorithms One direct call adds constant overhead to full refresh registry/incarnation/ancestry checks, then complete manifest byte acquisition, structured parsing and schema traversal. Refresh includes registration sorting and retired-key membership work; repeated numeric-token suffix slicing can add quadratic parser copying, without reading generated payloads.
     * @evidence contracts/performance.md#reuse-equivalent-work Each call reads the tracked manifest anew; returned data can be shared within the caller's attempt but is not memoized across revisions or file changes.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only instance state is retained between calls; parsed manifest data transfers to the caller and temporary bytes/parser/schema data follow the complete record size without a local cap. Delegated readers attempt cleanup and report refusal rather than guaranteeing host release; no manifest cache or task is retained.
     */
    public generatedManifest(): IAutoMovieGeneratedManifest | null {
        return productionProjectGeneratedManifest(this.state_);
    }
    /**
     * Read one resident selected-production state file, returning null only for initial absence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectReadTrackedStateFile with the instance's state. The direct incarnation check and tracked-path operation's repeated check retain their order; a missing lstat returns null, while a present target passes physical root/regular-file admission and the owned descriptor/ancestry reader.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. State addressing and byte ownership remain distinct operations; claim, repaint selection and delivery readers interpret these bytes through their own exact schemas.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe resident paths and read races are not reported as absence or replaced by empty bytes; no state-file name bypasses the physical read guard.
     * @evidence contracts/common.md#meaningful-documentation States null versus resident refusal and the repeated incarnation checks; the returned bytes are not independently schema-validated or a publication-currentness verdict.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Work includes two incarnation admissions, root/path observations and the B-byte guarded read with directory-depth checks; the repeated admission is preserved rather than elided as a claimed speedup.
     * @evidence contracts/performance.md#reuse-equivalent-work Captured generations are reused only as comparison bases; each invocation observes fresh resident bytes and no receipt/claim ID is treated as proof of byte equivalence.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only instance state is retained between calls; the owned reader attempts primary/recheck descriptor cleanup and reports close failures. Complete returned bytes transfer without a local byte cap, and no file-buffer cache, lock or task survives.
     */
    public readTrackedStateFile(relativePath: string): Uint8Array | null {
        return productionProjectReadTrackedStateFile(this.state_, relativePath);
    }
    /**
     * Resolve an address inside the selected production's tracked state root after current-incarnation admission.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectTrackedStatePath with the instance's state. Current root/namespace/incarnation guards precede native path resolution under productionStateRoot; the shared lexical resolver refuses escape while retaining its root-inclusive and contained-absolute semantics.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. One operation supplies state addresses to readers and diagnostic/publication owners; resident file shape and content validation stay with the consuming operation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale incarnation or escaping address gets a fallback path; returning the namespace root itself is not an admission that it is a readable state file.
     * @evidence contracts/common.md#meaningful-documentation Defines selected-root resolution, incarnation refusal and the path-only result; this function creates no target and reads no target payload.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Cost includes the full incarnation guard's registry/lineage and captured-ancestry observations, then path-length resolution; moving those checks to a callee does not make this a filesystem-free operation.
     * @evidence contracts/performance.md#reuse-equivalent-work The handle's captured identities remain guard premises; each call reacquires current records and physical observations instead of trusting an earlier resolved path.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Guarded readers own descriptor release; temporary records and pathname data are local, and only the resolved string escapes without a retained task or new namespace cache.
     */
    public trackedStatePath(relativePath: string): string {
        return productionProjectTrackedStatePath(this.state_, relativePath);
    }
    /**
     * Resolve the selected production's absolute generated-output root under the current project generation.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectGeneratedRoot with the instance's state. Complete incarnation/namespace admission precedes configured generated-root project/ancestor fencing and portable production-segment containment; resolution preserves a missing tail rather than creating a directory.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This address owner supplies the same selected root to generated readers and publication transactions, leaving resident file and payload admission with those consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale namespace or escaping configured ancestor receives a fallback root; this composition does not independently assert final generated-root existence or directory kind beyond its delegated observations.
     * @evidence contracts/common.md#meaningful-documentation States absolute selected-production address, missing-tail semantics and generation/containment refusal; no generated file is read or published by resolving the root.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes full registry/incarnation validation and captured ancestry fences, then configured-root nearest-ancestor/path work; the fixed path composition reads no generated payload population.
     * @evidence contracts/performance.md#reuse-equivalent-work The constructor's production segment and expected identities are reused as operands, while current registry and physical observations are reacquired instead of caching an output-root verdict.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Temporary registry records and path/stat data are local and readers own descriptor cleanup; only the absolute root string transfers, without a retained output inventory or task.
     */
    public generatedRoot(): string {
        return productionProjectGeneratedRoot(this.state_);
    }
    /**
     * Read one generated resident with typed initial absence and physical builder-root fencing.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectReadGeneratedFile with the instance's state. Current generated-root admission and lexical containment precede lstat, final-link refusal, realpath root containment and regular-file admission in that order; the owned reader then checks complete physical ancestry and descriptor identity around its byte read.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. The generated read owns resident path/byte admission, while manifest ownership/digest comparisons belong to generated inspection and compile/publication consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Only initial lstat absence creates AutoMovieGeneratedFileMissingError; links, unsafe roots, nonfiles and later read races retain their failures rather than becoming repairable missing output.
     * @evidence contracts/common.md#meaningful-documentation Defines typed initial absence, final-link and physical-root refusal and caller-owned returned bytes; it does not independently prove the manifest declared this file or that its digest is current.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes complete generated-root incarnation observations, native lstat/realpath checks and B-byte guarded read with directory-depth and descriptor fences; payload hashing/media parsing remain with consumers.
     * @evidence contracts/performance.md#reuse-equivalent-work One resolved root/file address serves this read, while resident bytes and physical identity are observed afresh; an unchanged manifest path alone cannot authorize reuse of a prior buffer.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The owned reader attempts primary/recheck descriptor release and propagates cleanup failures; full bytes transfer to the caller and temporary ancestry/stat/path data is not retained in the project handle.
     */
    public readGeneratedFile(relativePath: string): Uint8Array {
        return productionProjectReadGeneratedFile(this.state_, relativePath);
    }
}
