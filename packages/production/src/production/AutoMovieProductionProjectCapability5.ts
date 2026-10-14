import { IAutoMovieRenderBundleManifest } from "@automovie/interface";
import { AutoMovieRepaintClaimAdmission, IAutoMovieRepaintAttemptClaim } from "./repaintAttemptClaim";
import { AutoMovieProductionProjectCapability4 } from "./AutoMovieProductionProjectCapability4";
import { productionProjectReadProseDocument } from "./productionProjectReadProseDocument";
import { productionProjectProseDocumentExists } from "./productionProjectProseDocumentExists";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectCommitRenderBundle } from "./productionProjectCommitRenderBundle";
import { productionProjectAcquireRepaintAttemptClaim } from "./productionProjectAcquireRepaintAttemptClaim";

/**
 * Preserve the public project method group 5 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This base adds no per-instance handles, buffers, closure tables or tasks to the first base's retained state; operations own descriptor/lock cleanup attempts and propagate or report native refusal according to their own release contracts.
 */
export class AutoMovieProductionProjectCapability5 extends AutoMovieProductionProjectCapability4 {
    /**
     * Read author-owned text for builder document/source consumers while keeping missing-document diagnostics nullable. Current-incarnation failures propagate. Lexical escape, an absent or non-file final entry, and an outside-root realpath return null; a present admitted file is read through physical descriptor/ancestry guards and decoded with Node's UTF-8 Buffer conversion. Later native/read failures propagate rather than becoming missing-document results.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectReadProseDocument with the instance's state. Incarnation admission precedes lexical resolution, lstat and realpath containment; admitted resident bytes use the existing owned-file reader, preserving its physical generation checks before text conversion.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This shared nullable text boundary serves source snapshot and screenplay readers without assigning builder ownership to author files or duplicating descriptor admission.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the existing nullable path/entry conditions yield null; current-generation and guarded-read failures are not swallowed, and Buffer UTF-8 decoding does not claim strict malformed-byte refusal.
     * @evidence contracts/common.md#meaningful-documentation Gives author ownership, exact null/error distinctions, physical read boundary and UTF-8 decoding behavior; text return does not certify screenplay or source semantics.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Cost includes incarnation records/ancestries, native target checks and the B-byte read/copy/UTF-8 conversion; both returned text and temporary bytes scale with B.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call reads current author bytes and physical facts; an earlier document path or text result does not prove an unchanged builder input.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only instance state is retained between calls. The owned reader attempts descriptor cleanup and reports close failure; complete read bytes, the Buffer copy and decoded text can coexist without a byte cap, while only successful text transfers and no document cache or task survives.
     */
    public readProseDocument(relativePath: string): string | null {
        return productionProjectReadProseDocument(this.state_, relativePath);
    }
    /**
     * Observe any in-project entry so unsafe recovery markers remain visible instead of appearing as absent prose.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectProseDocumentExists with the instance's state. The presence owner checks current incarnation, strict lexical descendant and parent physical ancestry before lstat, then repeats parent and incarnation guards before returning presence, including dangling links or directories.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This adapter supplies the existing project guards to the dedicated presence reader; readable nullable text remains a separate readProseDocument contract.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe final recovery markers are observed as present rather than hidden behind a regular-text check; escape, root-address and unsafe-parent errors propagate without a fabricated absence.
     * @evidence contracts/common.md#meaningful-documentation Defines entry presence versus readable text, repeated generation/parent checks and refusal; a true result is not permission to read or publish that entry.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. The delegated operation performs two incarnation checks, two parent-depth walks and one target lstat, plus path-text resolution; no target payload or directory population is read.
     * @evidence contracts/performance.md#reuse-equivalent-work Constructor identity captures remain comparison inputs but both pre/post observations are fresh; prior presence cannot replace recovery-marker currentness checks.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Three invocation-local callbacks borrow state; guarded readers own any transient descriptor cleanup and no marker, byte cache or pending task survives the call.
     */
    public proseDocumentExists(relativePath: string): boolean {
        return productionProjectProseDocumentExists(this.state_, relativePath);
    }
    /**
     * Resolve the selected production's absolute render-output root after current namespace admission.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectRenderRoot with the instance's state. Incarnation and captured namespace checks precede configured render-root project/nearest-ancestor fencing and production-segment containment, preserving the existing native path and refusal order.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. One root-address operation is shared by capture, repaint, delivery and render reads; their owners separately admit resident directories/files, media and publication authority.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal root text cannot bypass generation checks; address resolution creates nothing and does not independently establish final directory existence/kind or complete descendant safety.
     * @evidence contracts/common.md#meaningful-documentation Defines absolute production-specific output address and delegated namespace/ancestor refusal; the returned path alone is not a current media or publication verdict.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Registry/incarnation record bytes, captured namespace components and configured-root missing ancestor depth drive delegated work; the final path composition scans no render member population.
     * @evidence contracts/performance.md#reuse-equivalent-work Retained production segment and captured generation expectations are shared operands, but each call reobserves current root facts instead of accepting a prior render-root success.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Delegated record readers own descriptor cleanup and temporary records/stat/path strings expire; only the root address escapes, without a render cache, byte buffer or capture task.
     */
    public renderRoot(): string {
        return productionProjectRenderRoot(this.state_);
    }
    /**
     * Read a regular render file between captured directory and reopened resident-file identity fences.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectReadRenderFile with the instance's state. Root/lexical admission and root-inclusive physical ancestry capture precede final regular-file/open checks; the primary descriptor's bigint device/inode is compared with reopened resident descriptors before and after reading, while each recheck also reobserves captured directories.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This reader owns render descriptor acquisition and byte transfer; ancestry/identity helpers own their representations and closeRenderFileDescriptor owns cause-preserving cleanup, with media validation left to callers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Same path spelling never replaces physical identity and no read is retried over a changed generation; the initial open catch assumes a native errno object, so an arbitrary null/undefined thrown value can produce a property-access error instead of preserving that value.
     * @evidence contracts/common.md#meaningful-documentation Defines missing/nonregular and physical-race refusal, two resident rechecks and caller-owned bytes; sequential fences do not prevent all intervening edits or prove content identity, and close failures remain observable cleanup limitations.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes complete render-root admission, D-component ancestry capture plus up to two D-component rechecks, one B-byte descriptor read and up to two resident reopen/stat comparisons; bytes are returned without hashing or media parsing.
     * @evidence contracts/performance.md#reuse-equivalent-work One captured ancestry and opened file identity serve both boundary rechecks, while resident descriptors and directory facts are reacquired each time instead of sharing a stale successful observation.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. At most the primary and one recheck descriptor are owned simultaneously; each acquired recheck reaches finally cleanup and the primary reaches cleanup after captured success/failure. Sole close failure propagates and combined failures aggregate in order, so attempted close is not claimed to prove host release; returned B-byte data transfers without retained tasks.
     */
    public readRenderFile(relativePath: string): Uint8Array {
        return productionProjectReadRenderFile(this.state_, relativePath);
    }
    /**
     * Publish one content-addressed capture bundle and its tracked manifest receipt.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitRenderBundle with the instance's state. Admits renderer identity and canonical portable bundle paths, copies supplied bytes, checks claimed frame/sidecar identities and semantic receipts, then commits payload/manifest/receipt with retained-input and post-write byte fences in the original sequence.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Bundle ownership stays here, semantic receipt admission stays with its verifier, and commitFiles owns revision locking and rollback accounting; captured frames are not decoded or rendered by this publisher.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects duplicate portable paths, foreign/duplicate semantic receipts and unclaimed bytes; retained snapshot read failures become null only to make currentness fail, and endpoint checks do not prove absence of an intervening ABA change.
     * @evidence contracts/common.md#meaningful-documentation Supplied frames must match their manifest digests, absent supplied frames must be resident, and each shot mask frame requires its semantic sidecar; post-publication refusal can invoke mutation rollback and incomplete cleanup must remain visible.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Supplied-map construction and digest checks touch payload bytes; S semantic receipts each search F frame records, so that linkage can cost O(S*F), in addition to path maps/sets, sidecar JSON parsing, repeated resident reads/hashes, serialization and commit staging/rollback costs.
     * @evidence contracts/performance.md#reuse-equivalent-work Owns copies of supplied bytes and one retained snapshot within this attempt, while callbacks reacquire resident payloads before and after publication; matching bundle addresses never replace byte/currentness checks.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Supplied buffers, payload snapshots and serialized records live through synchronous commit and are released on return/refusal; commitFiles additionally owns staged previous/current bytes, locks and temporary cleanup, so peak residency is not asserted as a fixed multiple of input bytes.
     */
    public commitRenderBundle(relativeBundle: string, files: ReadonlyMap<string, Uint8Array>, manifest: IAutoMovieRenderBundleManifest, inputCurrent?: () => boolean): number {
        return productionProjectCommitRenderBundle(this.state_, relativeBundle, files, manifest, inputCurrent);
    }
    /**
     * Reserve the next attempt under the existing production transaction before provider dispatch.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectAcquireRepaintAttemptClaim with the instance's state. Claim admission precedes the commit lock; inside it the complete current attempt prefix is hashed and the resident exact-schema claim checked before ordinal, production, prefix and generation agreement permit acquisition.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. The claim operation owns reservation metadata and admission status; commitFiles owns revision/namespace locking and execution owns provider dispatch and eventual settlement.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An active owner or unknown outcome blocks takeover; changed prefix/generation returns its explicit status without staging a replacement, and an empty transaction does not publish a revision here.
     * @evidence contracts/common.md#meaningful-documentation Defines acquired, already-active, unknown-outcome and prefix-changed outcomes; resident parsing/schema errors and transaction races throw rather than becoming acquisition success.
     * @evidence contracts/performance.md#efficient-algorithms One direct call adds constant overhead to metadata admission and its discarded structuredClone, complete attempt enumeration/validation/sort, canonical prefix encoding/hash and resident claim parsing/schema checks, then transaction guards and staged byte copies. Claim validation does not reject extra fields, so both clone and later serialization can include their complete object graph; structured parsing and nested canonical sorting remain part of the cost without a byte cap.
     * @evidence contracts/performance.md#reuse-equivalent-work The canonical current-prefix digest serves all admission comparisons inside the lock; previous request identity alone cannot replace fresh prefix and resident ownership observations.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only instance state is retained between calls; complete attempt records, canonical bytes, resident claim and cloned/staged claim data live through the synchronous transaction without a byte cap. commitFiles and readers attempt lock/descriptor retirement; native refusal can leave fences under the void release contract, while the returned admission starts no provider task.
     */
    public acquireRepaintAttemptClaim(claim: IAutoMovieRepaintAttemptClaim): AutoMovieRepaintClaimAdmission {
        return productionProjectAcquireRepaintAttemptClaim(this.state_, claim);
    }
}
