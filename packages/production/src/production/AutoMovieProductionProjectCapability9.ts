import { IAutoMovieDesignTarget, IAutoMovieScreenplayIndex } from "@automovie/interface";
import { AutoMovieProductionProjectCapability8 } from "./AutoMovieProductionProjectCapability8";
import { productionProjectScreenplayIndex } from "./productionProjectScreenplayIndex";
import { productionProjectDesignRecordPath } from "./productionProjectDesignRecordPath";

/**
 * Preserve the public project method group 9 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability9 extends AutoMovieProductionProjectCapability8 {
    /**
     * Read the optional screenplay index under refreshed production identity.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectScreenplayIndex with the instance's state. Refreshes resident production identity/revision before loading the typed owned screenplay index; missing data remains null and malformed present JSON refuses.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This public-read coordinator leaves tracked path and schema ownership to loadScreenplayIndex rather than creating an alternate screenplay ledger.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not regenerate coverage from prose text or silently replace an invalid index; index schema admission is separate from its semantic linkage to authored records.
     * @evidence contracts/common.md#meaningful-documentation Describes optional absence and refreshed acquisition without claiming that the index proves current lexical wording or rendered film behavior.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes refresh and one index read/parse/schema walk proportional to index bytes and entries; it does not scan screenplay Markdown here.
     * @evidence contracts/performance.md#reuse-equivalent-work Reacquires the index for each call and transfers the result for attempt-local reuse, without treating a previous revision or matching ids as immutable content.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Only returned index data survives for its caller; the guarded reader closes its file descriptor and this operation retains no prose, parser or task cache.
     */
    public screenplayIndex(): IAutoMovieScreenplayIndex | null {
        return productionProjectScreenplayIndex(this.state_);
    }
    /**
     * Format one supported design target as a project-relative record path.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectDesignRecordPath with the instance's state. Delegates target-kind/id routing to designPath then applies the native project-relative path formatter; this formats an address rather than opening a record.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Keeps kind routing with designPath and presentation with relativeToRoot, so the facade does not duplicate shared-versus-production design layout.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same encoded target id and directory policy for every caller; a formatted path is not a physical filesystem ownership proof.
     * @evidence contracts/common.md#meaningful-documentation The returned path is relative to the selected project root and may identify an absent optional record; routing refusal propagates for unsupported targets.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. String encoding and native path operations cost time/space proportional to root and target-id lengths, with no directory enumeration or record parse.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work One deterministic address formatting call has no acquisition or effect to share across requests; consumers retain a path if their own attempt needs it.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Transfers one path string to the caller and opens no descriptor, lock or task; project state lifetime remains with the facade.
     */
    public designRecordPath(target: IAutoMovieDesignTarget): string {
        return productionProjectDesignRecordPath(this.state_, target);
    }
}
