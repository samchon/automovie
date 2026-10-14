import { IAutoMovieProductionManifest } from "@automovie/interface";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import type { IAutoMovieProductionProjectSummary } from "./IAutoMovieProductionProjectSummary";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectManifest } from "./productionProjectManifest";
import { productionProjectProjectStateRecords } from "./productionProjectProjectStateRecords";
import { productionProjectProductionIds } from "./productionProjectProductionIds";
import { productionProjectContentInputs } from "./productionProjectContentInputs";
import { productionProjectSummary } from "./productionProjectSummary";
import { productionProjectRevision } from "./productionProjectRevision";

/**
 * Preserve the public project method group 1 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability1 {
    public constructor(protected readonly state_: AutoMovieProductionProjectState) {
    }
    /**
     * Return a detached layout manifest after refreshing the production fence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectManifest with the instance's state. Refreshes the physical root, incarnation and resident revision before structured-cloning the admitted opening manifest, preserving unknown legacy fields without sharing mutable nested values.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This read projection owns cloning; refresh owns currentness checks and does not reload arbitrary layout fields from disk.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No production-specific projection drops unknown fields, and an identity or revision refusal propagates before any manifest is returned.
     * @evidence contracts/common.md#meaningful-documentation Distinguishes a detached opening layout from a newly parsed resident manifest and states the refresh-before-return boundary.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes namespace checks and a revision JSON read, then clones all manifest data in time and space proportional to its serialized structure.
     * @evidence contracts/performance.md#reuse-equivalent-work Reuses the opening's admitted layout but creates a new mutable result for each caller; a matching revision does not replace the current physical fence.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The caller owns the detached clone; state keeps its original manifest, and this projection retains no descriptor or task after return or refusal.
     */
    public manifest(): IAutoMovieProductionManifest {
        return productionProjectManifest(this.state_);
    }
    /**
     * Read the project-wide incarnation's exact resident bytes for publication input identity.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectProjectStateRecords with the instance's state. Current project/state/production incarnation and captured namespace checks precede physical AutoMovie-root admission; the constructor's incarnation.json location is a direct child of that root and passes regular-file and owned descriptor/ancestry admission.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This projection exposes the one project-wide record publication fingerprinting needs, while logical generation checks and byte hashing remain with their existing owners.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No parsed/reserialized incarnation replaces exact resident bytes; the basename read relies on the constructor's direct-child path and does not accept arbitrary nested record addresses.
     * @evidence contracts/common.md#meaningful-documentation Defines the single incarnation byte field, its project-wide ownership and propagated resident/generation refusal; it is one current observation rather than an atomic snapshot of every publication input.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes complete incarnation admission and root/regular-file observations plus the B-byte guarded record read with ancestry fences; publication consumers separately hash the transferred bytes.
     * @evidence contracts/performance.md#reuse-equivalent-work Constructor identities and paths supply guard operands, while exact resident bytes are freshly acquired for each fingerprint request instead of reusing a parsed incarnation or previous digest.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The owned reader attempts descriptor cleanup on success/failure and surfaces cleanup refusal; one full byte buffer transfers to the publication caller and this projection retains no record cache or task.
     */
    public projectStateRecords(): {
        incarnation: Uint8Array;
    } {
        return productionProjectProjectStateRecords(this.state_);
    }
    /**
     * Read the currently registered production ids under the active namespace fence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectProductionIds with the instance's state. Refreshes root/incarnation/revision, reads the owned registry and validates its production entries before copying their code-unit-sorted ids; malformed present registry data refuses.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Registry schema admission stays in its validator, while this operation exposes only a detached id array to the facade and summary reader.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps validator sorting and missing-registry refusal policy without treating arbitrary read failures as an empty project or deduplicating conflicting portable id spellings.
     * @evidence contracts/common.md#meaningful-documentation States that ids are current registry observations, with production currentness checked before their acquisition rather than a cached opening list.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes physical/revision checks, full registry read/parse/validation and an O(P) result copy; validation sorts P ids in O(P log P) and can perform O(K*P) membership work for K retired incarnation keys, in addition to id encoding.
     * @evidence contracts/performance.md#reuse-equivalent-work Reads the registry again for each call because other production mutations can change it independently; only the opening identity expectations are shared.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Parsed registry data is temporary and the copied ids transfer to the caller; owned-file acquisition closes its descriptor and this operation retains no registry cache.
     */
    public productionIds(): string[] {
        return productionProjectProductionIds(this.state_);
    }
    /**
     * Snapshot source and render content bytes for compiler/currentness fingerprints.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectContentInputs with the instance's state. Every declared source and constant content root must be a contained physical directory; linked or escaping entries refuse, selected optional file absence is represented by null rather than empty bytes.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. One path-keyed map gathers all classified inputs before global code-unit sorting; root/path admission and guarded descriptor reads remain delegated.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Root traversal and exact bytes are not replaced by watcher quietness; overlapping roots follow existing later-write flag replacement rather than merging classifications.
     * @evidence contracts/common.md#meaningful-documentation Returns caller-owned bytes and source/render flags; absent content directories still refuse even though constructor layout admission can permit them, and the asset manifest has neither flag.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Visits all selected entries, sorts each directory and final paths, performs ancestry/realpath checks and reads total B bytes; overlapping roots can repeat reads and Map replacement does not remove that cost.
     * @evidence contracts/performance.md#reuse-equivalent-work Each call is a fresh snapshot; paths deduplicate the returned population but repeated traversal/read work is not cached across roots or attempts.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The caller owns all retained B bytes and records without a fixed byte cap; local traversal data release and owned readers close descriptors on success/failure, while recursive stack grows with depth.
     */
    public contentInputs(): IAutoMovieProductionContentInput[] {
        return productionProjectContentInputs(this.state_);
    }
    /**
     * Project opening metadata and a current registry observation into a summary.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSummary with the instance's state. Refreshes state before assembling root, active id, format, revision and initialization status, and delegates current production ids to the registry reader which refreshes again in the original order.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Summary is a read projection of existing state and registry facts; it introduces no separate summary ledger or mutation service.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the nested refresh rather than assuming the first check covers a later registry read; observations across files are not an atomic snapshot.
     * @evidence contracts/common.md#meaningful-documentation Opening-time initialized/format fields and refreshed revision/registry fields have distinct lifetimes, so the summary does not assert all fields were acquired simultaneously.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes two refresh paths and one complete registry admission/copy, with registry bytes and production count driving the dominant work.
     * @evidence contracts/performance.md#reuse-equivalent-work Shares immutable opening metadata while acquiring resident registry and revision again; the duplicated guard is retained to preserve existing observation order.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The returned object and its production-id array belong to the caller; no summary cache, handle or running task is retained.
     */
    public summary(): IAutoMovieProductionProjectSummary {
        return productionProjectSummary(this.state_);
    }
    /**
     * Refresh and return the resident optimistic revision generation.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectRevision with the instance's state. Uses the same namespace and revision decoder as commits before returning the stored safe integer; a missing admitted revision keeps the decoder's initial-zero policy.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Adds only the public number projection to refresh, leaving malformed/exhausted generation policy with the shared revision owner.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Never increments or coerces a generation during a read, and deleted or replaced namespace errors propagate.
     * @evidence contracts/common.md#meaningful-documentation The result is one resident observation used for optimistic comparison, not a lease guaranteeing that later content remains unchanged.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Work is refresh's physical ancestry checks and small revision record read/parse; no generated, design or media population is scanned.
     * @evidence contracts/performance.md#reuse-equivalent-work Updates this instance's lastReadRevision_ but reacquires its source on every call instead of trusting a previously matching number.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Retains one scalar in state; file-reader handles close through the delegated acquisition and no per-read object population or task survives.
     */
    public revision(): number {
        return productionProjectRevision(this.state_);
    }
}
