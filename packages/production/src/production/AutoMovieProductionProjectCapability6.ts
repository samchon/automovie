import { IAutoMovieRepaintReceipt } from "@automovie/interface";
import { AutoMovieRepaintClaimSettlement, IAutoMovieRepaintAttemptClaim } from "./repaintAttemptClaim";
import { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import { IAutoMovieRepaintRawOutputPublication } from "./repaintRawOutput";
import { AutoMovieProductionProjectCapability5 } from "./AutoMovieProductionProjectCapability5";
import { productionProjectSettleRepaintAttemptClaim } from "./productionProjectSettleRepaintAttemptClaim";
import { productionProjectCommitRepaintAttempt } from "./productionProjectCommitRepaintAttempt";
import { productionProjectCommitRepaintRawOutput } from "./productionProjectCommitRepaintRawOutput";
import { productionProjectRepaintRawOutput } from "./productionProjectRepaintRawOutput";
import { productionProjectRepaintRequestAttempts } from "./productionProjectRepaintRequestAttempts";
import { productionProjectCommitRepaintRendition } from "./productionProjectCommitRepaintRendition";

/**
 * Preserve the public project method group 6 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability6 extends AutoMovieProductionProjectCapability5 {
    /**
     * Persist one settlement only while the complete immutable claim still belongs to its caller.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSettleRepaintAttemptClaim with the instance's state. Claim validation precedes the locked resident read; exact schema and canonical equality of the entire claim establish ownership, and a prior settlement must equal the requested settlement before its replacement record is staged.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Settlement metadata remains separate from terminal attempt/output publication; the shared transaction owner supplies generation, revision and rollback authority.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or changed resident ownership refuses, and conflicting settlement is not overwritten; no provider outcome is inferred from the caller's requested classification.
     * @evidence contracts/common.md#meaningful-documentation States canonical claim ownership and same-settlement compatibility; successful return is the transaction revision, with parsing, ownership and transaction failures propagated.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Reads/parses resident claim bytes and canonicalizes two complete claim values, then serializes one staged record; delegated transaction work includes current generation observations and prior/new staged bytes.
     * @evidence contracts/performance.md#reuse-equivalent-work The admitted resident claim supplies the replacement's immutable fields; no cached settlement or attempt ID bypasses complete current ownership comparison.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Resident bytes, parsed claim, canonical strings and staged serialization are call-local; commitFiles owns lock/rollback-buffer release and the function retains no claim cache or asynchronous task.
     */
    public settleRepaintAttemptClaim(claim: IAutoMovieRepaintAttemptClaim, settlement: AutoMovieRepaintClaimSettlement): number {
        return productionProjectSettleRepaintAttemptClaim(this.state_, claim, settlement);
    }
    /**
     * Publish the next immutable terminal attempt while guarding its complete request prefix.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitRepaintAttempt with the instance's state. Individual attempt admission and any cited resident raw-output revision precede duplicate-path and chronological-prefix checks; the transaction callback accepts only the observed prefix or that prefix plus this exact attempt.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Terminal ledger publication composes record, raw-output and ordered-prefix owners; commitFiles retains namespace/revision checks and rollback, while execution determines the provider result.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An existing attempt or a nonretryable predecessor refuses; immutable request fields and chronology cannot drift, and a failed input-current callback or prefix read never becomes a successful publication guard.
     * @evidence contracts/common.md#meaningful-documentation Defines next ordinal, predecessor compatibility, optional raw-output citation and pre/post prefix equivalence; resident or transaction failures propagate and this operation dispatches no provider.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes raw-output admission when cited, complete prefix read/validation/sort and canonical serialization of prior/next ledgers; each transaction currentness callback rereads and canonicalizes the prefix, with costs scaling with ledger/output bytes and parser populations.
     * @evidence contracts/performance.md#reuse-equivalent-work Prior and next canonical identities are reused across transaction callback invocations; current prefixes are still reobserved so equality is based on complete metadata rather than an attempt ID.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Prior records and both canonical ledger strings remain live through the synchronous transaction; cited output bytes and guarded-read buffers are temporary, and commitFiles owns lock/staging cleanup without a retained execution task.
     */
    public commitRepaintAttempt(attempt: IAutoMovieRepaintAttemptRecord, inputCurrent?: () => boolean): number {
        return productionProjectCommitRepaintAttempt(this.state_, attempt, inputCurrent);
    }
    /**
     * Publish validated raw repaint bytes together with their immutable tracked receipt.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitRepaintRawOutput with the instance's state. The raw-output owner validates receipt/bytes before production and absent-receipt checks; the transaction stages output plus receipt and its input guard permits only absence or exact receipt serialization before and after application.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Raw publication owns the byte/receipt pair while downstream attempt and rendition owners decide terminal and delivery eligibility; commitFiles supplies atomic staging, namespace checks and rollback.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A resident receipt cannot be replaced and another production refuses; the optional input-current check is honored at both transaction boundaries, without substituting a missing receipt for output validation.
     * @evidence contracts/common.md#meaningful-documentation States immutable raw revision, exact receipt guard and returned revision; receipt metadata, retention ceiling, digest, address, ownership and transaction errors propagate. Raw bytes need not be a valid media file and this path performs no media probe or delivery admission.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Raw validation hashes supplied bytes and checks receipt text, retention ceiling and canonical address before receipt serialization; commit staging copies new bytes and reads any prior output, and each boundary guard reads/compares resident receipt bytes without media parsing.
     * @evidence contracts/performance.md#reuse-equivalent-work One receipt serialization supplies both staging and exact resident comparisons; supplied output bytes are reused for validation/staging without caching a prior raw-output verdict.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The caller owns supplied bytes; staged new/prior buffers and guard receipt copies coexist during the transaction and scale with actual file sizes, while commitFiles releases locks and rollback state on every exit.
     */
    public commitRepaintRawOutput(publication: IAutoMovieRepaintRawOutputPublication, inputCurrent?: () => boolean): number {
        return productionProjectCommitRepaintRawOutput(this.state_, publication, inputCurrent);
    }
    /**
     * Read and revalidate one resident raw-output receipt and its exact render bytes.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectRepaintRawOutput with the instance's state. Canonical request/attempt receipt addressing leads to a guarded resident read, duplicate-aware parsing and exact schema; the recorded output bytes then pass the shared raw-output validator for both requested identities.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This reader owns current resident publication observation, using the same validation policy as raw publication rather than inventing another receipt protocol.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or malformed receipt throws and a stored digest alone cannot prove resident bytes; output-read and raw-validation failures propagate without empty-byte or prior-result substitution, and raw retention does not imply media validity.
     * @evidence contracts/common.md#meaningful-documentation Defines required receipt/output presence, request/attempt identity and returned byte ownership; successful return describes the observed raw revision, not a final deliverable or future unchanged state.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Cost includes repeated tracked/render namespace admission, receipt parsing and the full B-byte output read/hash plus receipt text/address checks; no media box or sample parsing occurs in this raw-retention reader.
     * @evidence contracts/performance.md#reuse-equivalent-work The admitted receipt supplies the resident output locator and validator inputs within this read; fresh bytes are required instead of reusing a previous request/attempt verdict.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Guarded readers close descriptors and temporary receipt parse/validation state expires; receipt and full output bytes transfer to the caller, with no retained JSON parser, receipt cache or provider task.
     */
    public repaintRawOutput(requestId: string, attemptId: string): IAutoMovieRepaintRawOutputPublication {
        return productionProjectRepaintRawOutput(this.state_, requestId, attemptId);
    }
    /**
     * Read the complete canonical terminal-attempt population for one immutable request in ordinal order.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectRepaintRequestAttempts with the instance's state. The request UUID fences discovery; linked directories and nonregular JSON residents refuse, each guarded duplicate-aware record passes attempt admission and canonical filename agreement, and sorted records must form a contiguous chronological retryable lineage.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This reader owns whole-request population and predecessor coherence; individual metadata validation and execution-policy aggregation remain with their dedicated owners.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed siblings are not omitted to produce a valid prefix; gaps, divergent immutable identity or an ineligible predecessor throw, while initial directory absence alone yields an empty ledger.
     * @evidence contracts/common.md#meaningful-documentation Defines discovery, filename and ordinal sorting, missing-directory behavior and complete-lineage refusal; it does not by itself prove every attempt's output bytes or immutable policy compliance.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. E directory entries are filtered and A JSON records sorted by filename then ordinal in O(E + A log A) comparisons plus text costs; each record incurs guarded parsing/identity validation and namespace observations, followed by one chronological pass.
     * @evidence contracts/performance.md#reuse-equivalent-work The complete admitted array supplies both ordered return and predecessor checks; directory membership and resident bytes are refreshed instead of caching a request prefix.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Discovery arrays, decoded records and ordinal ordering scale with resident population; guarded readers close descriptors and the complete record array transfers to the caller without retaining per-record byte buffers or timers.
     */
    public repaintRequestAttempts(requestId: string): IAutoMovieRepaintAttemptRecord[] {
        return productionProjectRepaintRequestAttempts(this.state_, requestId);
    }
    /**
     * Publish a current delivery-admissible repaint clip with its tracked candidate receipt.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectCommitRepaintRendition with the instance's state. Exact v4 schema admission precedes full current-receipt/byte validation; the render output and canonical tracked receipt paths are then staged together through the existing transaction with the optional input-current callback.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Candidate publication composes current compile/source/attempt/reference/media owners and the transaction owner; active selection remains a later explicit operation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid or stale clip cannot be made current by publishing its receipt; no media rewrite, profile tolerance or implicit active-selection pointer is introduced.
     * @evidence contracts/common.md#meaningful-documentation States candidate byte/receipt publication, revision result and optional transaction currentness; schema, source/attempt/reference/media and mutation refusals propagate.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes all current-receipt dependencies: current graph/manifest and reference populations, source bundle frame/mask observations, attempt ledger, output hashing and separate MP4 probe/splice admission, then staged new/prior byte copies.
     * @evidence contracts/performance.md#reuse-equivalent-work The same admitted receipt and caller bytes feed verification and publication; validation is not cached across revisions and the commit callback remains the caller's publication-currentness authority.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Caller bytes remain borrowed during validation; graph/ledger/parser objects and staged new/prior buffers scale with actual inputs and expire with the synchronous transaction, whose owner releases locks and descriptors.
     */
    public commitRepaintRendition(receipt: IAutoMovieRepaintReceipt, bytes: Uint8Array, inputCurrent?: () => boolean): number {
        return productionProjectCommitRepaintRendition(this.state_, receipt, bytes, inputCurrent);
    }
}
