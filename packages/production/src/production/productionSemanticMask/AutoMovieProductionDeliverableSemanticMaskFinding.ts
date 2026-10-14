import { IAutoMovieProductionSemanticMaskReceipt } from "./IAutoMovieProductionSemanticMaskReceipt";

/**
 * Delivered-file standing: ordinary media, a reopened complete semantic mask, or an explained unreceipted, unbound, stale or incomplete refusal. A semantic-mask result references the admitted original receipt.
 *
 * @evidence contracts/common.md#principled-implementation A closed union encodes each admission failure separately; the classifier checks actual probe, ledger path, current plan and canonical resident bytes before success.
 * @evidence contracts/common.md#clear-and-simple-design Final builder diagnostics and the terminal publication assertion consume one discriminant rather than recreate divergent semantic admission policies; the removed proxy preflight is not a current consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape provides no bypass for missing receipts or incomplete coverage; ordinary media means the file has no semantic receipt/semantic probe role.
 * @evidence contracts/common.md#meaningful-documentation Documents retained receipt ownership, all refusal causes and the distinction between media association and a current complete semantic product.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased result union chooses no processing strategy; plan scans and byte/schema/hash verification occur in the classifier.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No completed or in-flight work is retained by this type; matching status values alone do not prove equivalent file generations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handles, bytes or tasks. Classifier callers own reason/receipt references and decide how long their ledger observations remain retained.
 */
export type AutoMovieProductionDeliverableSemanticMaskFinding = {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "media";
} | {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "semantic-mask";

    /** Committed semantic receipt whose frame, shot, coverage and bytes must match. */
    receipt: IAutoMovieProductionSemanticMaskReceipt;
} | {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "unreceipted" | "unbound" | "stale" | "incomplete";

    /** Original absence or refusal explanation; non-blank checks do not grade its prose. */
    reason: string;
};
