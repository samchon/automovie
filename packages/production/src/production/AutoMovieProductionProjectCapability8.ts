import { AutoMovieGuidePass, IAutoMovieGeneratedManifest, IAutoMovieProductionRenderManifest, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { AutoMovieProductionProjectCapability7 } from "./AutoMovieProductionProjectCapability7";
import { productionProjectCapturedRenderViews } from "./productionProjectCapturedRenderViews";
import { productionProjectVerifiedRenderManifest } from "./productionProjectVerifiedRenderManifest";
import { productionProjectCommitProductionPublication } from "./productionProjectCommitProductionPublication";
import { productionProjectCommitProductionDeliverableFiles } from "./productionProjectCommitProductionDeliverableFiles";
import { productionProjectCommitGenerated } from "./productionProjectCommitGenerated";
import { productionProjectConfirmCurrentSnapshot } from "./productionProjectConfirmCurrentSnapshot";

/**
 * Preserve the public project method group 8 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability8 extends AutoMovieProductionProjectCapability7 {
    /**
     * Collect frame view facts from resident verified bundles under the requested target and fingerprint address.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCapturedRenderViews with the instance's state. Incarnation and render-root admission precede target/fingerprint directory discovery; only subdirectories whose manifest verifier returns an admitted bundle contribute frames, with matching semantic coverage cloned into each view.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. View projection delegates byte/receipt/media/semantic verification to the bundle owner; callers retain interpretation of requested target/current compile because this function constructs the discovery address without adding separate manifest target/fingerprint equality checks.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid bundles are omitted according to the verifier's nullable contract, without inventing frame facts; absent or non-directory discovery yields empty output and native enumeration failures are not fabricated as valid captures.
     * @evidence contracts/common.md#meaningful-documentation Defines address-driven discovery, nullable bundle filtering, native entry/frame order and optional coverage copies; returned facts do not independently certify all expected views or a current compile snapshot.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Cost includes directory discovery and every selected bundle's full frame/mask byte and parser verification; projecting F frames searches up to K semantic records per frame and clones admitted coverage populations, preserving the existing O(F times K) matching work.
     * @evidence contracts/performance.md#reuse-equivalent-work Each admitted manifest supplies both frame values and corresponding coverage lookup; current bundle verification is performed once per discovered directory without a persistent captured-view cache.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Manifest/verification byte data is temporary per bundle, while projected views and cloned unresolved coverage grow with captured population and transfer to the caller; readers own descriptors and no renderer task is started.
     */
    public capturedRenderViews(target: IAutoMovieRenderBundleManifest["target"], fingerprint: string): Array<{
        time: number;
        pass: AutoMovieGuidePass;
        semanticCoverage?: {
            unresolved: string[];
            unaddressed: number;
        };
    }> {
        return productionProjectCapturedRenderViews(this.state_, target, fingerprint);
    }
    /**
     * Return a resident render bundle only when its address, ownership receipt, frame bytes and semantic sidecars all agree.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectVerifiedRenderManifest with the instance's state. Guarded manifest parse/exact schema and capture runtime identity precede canonical bundle path and receipt digest agreement; case-folded frame paths and semantic keys must be unique, frame PNG digests/dimensions admitted, and every mask frame must have a verified semantic sidecar.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This resident verifier composes project byte fencing, bundle identity, media probing and semantic receipt admission; capture/publication and compile-currentness decisions remain with its callers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A receipt or digest alone cannot hide corrupt frames or missing mask evidence; all failures inside this verifier yield null, which deliberately merges absence, unsafe paths, invalid data and native errors without repairing them.
     * @evidence contracts/common.md#meaningful-documentation Defines full resident verification and nullable refusal, uniqueness rules and shot-mask sidecar requirement; the tracked bundle receipt uses its existing field checks rather than a new strict receipt schema, and current generated compile equality is not independently checked here.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Reads/parses manifest and receipt, hashes/probes all F frame byte populations and parses/verifies K semantic sidecars; each sidecar performs a linear frame match and final mask coverage scans frames, alongside PNG/semantic parser work and repeated namespace guards.
     * @evidence contracts/performance.md#reuse-equivalent-work One admitted manifest supplies path, receipt and frame/semantic checks, with Sets reused for duplicate/coverage membership; mutable resident bytes are freshly read rather than trusting an earlier bundle verdict.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Manifest records, uniqueness Sets and original manifest bytes remain local while frame/sidecar/parser buffers are processed; admitted metadata escapes, guarded readers release descriptors and no pixel buffer, parser object or inspection task is retained.
     */
    public verifiedRenderManifest(manifestPath: string): IAutoMovieRenderBundleManifest | null {
        return productionProjectVerifiedRenderManifest(this.state_, manifestPath);
    }
    /**
     * Publish immutable deliverable payloads and the terminal render manifest/receipt.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitProductionPublication with the instance's state. Structurally validates and clones the manifest, binds it to the current plan/publication identity and builder fingerprint, verifies unique claimed bytes and media/semantic facts, then uses guarded revision commit with byte/ledger checks on both sides of the final publication gate.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Owns terminal payload and receipt correspondence while media probes, semantic mask admission, publication identity and mutation accounting retain their respective responsibilities; it creates no encoder or render host.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, duplicate, unclaimed or digest-mismatched files refuse; resident immutable paths are reused only after exact byte comparison, and currentness callbacks are observations rather than a guarantee against every between-check ABA race.
     * @evidence contracts/common.md#meaningful-documentation Documents the terminal ledger and immutable payload policy, with malformed media or stale plan/input refusing before final revision publication; delegated rollback can report incomplete cleanup after partial filesystem effects.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes full manifest schema walk/clone, O(P log P) receipt sorting for P files, payload copies and hashing, per-format probe costs, serialization, commit staging and two post-write payload read/hash passes; MP4 probing also parses boxes/sample tables and performs media-range residency lookup, not merely O(1) metadata comparisons.
     * @evidence contracts/performance.md#reuse-equivalent-work One owned supplied-byte map serves hashing/probing/staging and one cloned manifest serves all checks; existing immutable files are compared before reuse, while plan/input callbacks and resident bytes are deliberately reobserved at commit boundaries.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Attempt-owned payload copies, cloned manifest, media probe records and receipt/ledger strings remain until synchronous commit finishes; parsed MP4 copies/sample metadata and commit previous/current buffers contribute additional residency, so no unmeasured fixed peak factor is promised; commitFiles owns locks/temporary cleanup.
     */
    public commitProductionPublication(props: {
        files: ReadonlyMap<string, Uint8Array>;
        manifest: IAutoMovieProductionRenderManifest;
        plan: IAutoMovieProductionRenderJobPlan;
        planCurrent: () => boolean;
        inputCurrent: () => boolean;
        publicationCurrent: () => void;
        expectedRevision: number;
    }): number {
        return productionProjectCommitProductionPublication(this.state_, props);
    }
    /**
     * Publish the supplied nonempty deliverable file set in canonical path order under the selected render namespace.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitProductionDeliverableFiles with the instance's state. Portable deliverable ID and root-contained path resolution precede case-folded duplicate refusal; sorted normalized entries are passed to the existing transaction and returned as deliverable-relative paths with its revision.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This adapter owns supplied-set path projection and ordering; media/schema validation and aggregate delivery ledger publication remain separate caller responsibilities, while commitFiles owns staging and rollback.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty sets, lexical escapes and portable collisions refuse; this operation neither deletes unspecified resident members nor treats arbitrary supplied bytes as a verified deliverable.
     * @evidence contracts/common.md#meaningful-documentation States canonical supplied-set publication, revision/path output and retained namespace guards; existing extra files are outside this update and callers must judge media/currentness independently.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. F entries are projected, case-checked and sorted in O(F log F) comparisons plus path text; transaction staging copies all new bytes and reads prior target bytes for rollback, so total work/storage includes actual supplied and replaced payloads.
     * @evidence contracts/performance.md#reuse-equivalent-work Normalized entries are reused for transaction paths and returned relative addresses; the portable Set handles collision checks without another population scan, and there is no cross-publication byte cache.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Input byte arrays are borrowed and entry arrays reference them; commitFiles owns copied new/prior buffers and lock cleanup, while only revision/path strings escape without retaining deliverable media or an asynchronous task.
     */
    public commitProductionDeliverableFiles(deliverableId: string, files: ReadonlyMap<string, Uint8Array>): {
        revision: number;
        paths: string[];
    } {
        return productionProjectCommitProductionDeliverableFiles(this.state_, deliverableId, files);
    }
    /**
     * Publish one complete generated candidate with guarded byte comparison and revision accounting.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitGenerated with the instance's state. A lazy planner runs under commit locks, retires previous members, compares copied candidate bytes and writes the manifest last; output verification runs before revision publication.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. The planner owns changed-write selection, commitFiles owns mutation/rollback, and outputCurrent owns exact resident inventory and bytes.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Identical writes preserve the current revision; unsafe read errors propagate rather than becoming missing-file repairs. Callers must supply the manifest/currentness guard for the same candidate.
     * @evidence contracts/common.md#meaningful-documentation Returns the transaction revision; verification or input races can refuse and rollback, while post-revision failure may report already committed data.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes complete candidate/resident byte reads and copies, manifest serialization, retirement scans, staged previous bytes, atomic writes and full inventory/payload verification, even for a byte-identical no-op.
     * @evidence contracts/performance.md#reuse-equivalent-work Byte-identical members avoid writes after fresh observation; previous bytes remain available for rollback, and currentness callbacks are rerun rather than memoized.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. CommitFiles releases namespace/locks and atomic temporaries; candidate, resident and rollback buffers live for the attempt without a fixed byte cap, then return only the revision.
     */
    public commitGenerated(files: ReadonlyMap<string, Uint8Array>, manifest: IAutoMovieGeneratedManifest, inputCurrent?: () => boolean, expectedRevision: number = this.state_.lastReadRevision_): number {
        return productionProjectCommitGenerated(this.state_, files, manifest, inputCurrent, expectedRevision);
    }
    /**
     * Confirm the observed revision and caller input predicate through the existing read-only or writable authority path.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectConfirmCurrentSnapshot with the instance's state. Read-only confirmation checks expected versus last-observed revision, the input predicate and a fresh revision in that short-circuit order; writable confirmation runs the existing locked transaction with an empty stage and empty-revision publication disabled.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This operation exposes snapshot confirmation without another lock or snapshot representation; the caller defines complete input equivalence and the transaction/revision owners supply current generation observations.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A false predicate or moved revision refuses rather than retrying or updating inputs; the writable empty transaction is not represented as an output publication or new revision.
     * @evidence contracts/common.md#meaningful-documentation Defines the default last-read revision, branch-specific checks and returned revision; a caller predicate's coverage limits remain its responsibility and read-only endpoint observation does not prevent a later filesystem change.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Cost includes caller-defined input-current work plus a guarded revision read for the read-only branch or complete namespace/revision/lock and pre/post predicate work for the writable empty transaction; empty staging does not make confirmation filesystem-free.
     * @evidence contracts/performance.md#reuse-equivalent-work The supplied expected revision remains the comparison basis across the operation; input facts and resident revision are reobserved, with no cached successful predicate replacing required checks.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The predicate and state are borrowed synchronously; writable lock/lease cleanup belongs to commitFiles and read-only reader cleanup to revision owners, with no staged payload, timer or retained confirmation task.
     */
    public confirmCurrentSnapshot(inputCurrent: () => boolean, expectedRevision: number = this.state_.lastReadRevision_): number {
        return productionProjectConfirmCurrentSnapshot(this.state_, inputCurrent, expectedRevision);
    }
}
