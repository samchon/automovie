import { ProductionReviewEvidenceOwedView } from "./ProductionReviewEvidenceOwedView";

/**
 * Name the first six missing contract frame/pass obligations in their original order and report the exact remaining count. The display limit bounds listed entries, not text lengths, declared obligations or acceptance policy.
 *
 * @evidence contracts/common.md#principled-implementation Slices up to six items, formats each identifier/time/pass, and appends a remainder count only when more obligations exist.
 * @evidence contracts/common.md#clear-and-simple-design A presentation helper keeps bounded diagnostic listing separate from the full missing-pair detection, which has already inspected every obligation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The six-entry limit changes explanation size only; no additional missing obligation becomes accepted or erased from the actual comparison.
 * @evidence contracts/common.md#meaningful-documentation Documents order, six-entry display rule, authored seconds and honest remainder; it does not judge authored prose or clamp total identifier length.
 * @evidence contracts/performance.md#efficient-algorithms Visits at most six records, but formatting cost/storage scales with their identifier lengths and numeric spellings; missing-array population is borrowed and not rescanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No effectful work or cache is coordinated; the already-computed missing array is used for this explanation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a bounded-entry temporary slice and unbounded-by-character output text are allocated; caller owns returned text, with no handle or task retained.
 */
export const productionReviewEvidenceDescribeMissing: (missing: readonly ProductionReviewEvidenceOwedView[]) => string = (missing: readonly ProductionReviewEvidenceOwedView[]): string => {
    const LIMIT: number = 6;
    const named: string = missing
        .slice(0, LIMIT)
        .map((view: ProductionReviewEvidenceOwedView): string => `"${view.frame}" at ${view.time}s (${view.pass})`)
        .join(", ");
    return missing.length <= LIMIT
        ? `Missing ${named}.`
        : `Missing ${named}, and ${missing.length - LIMIT} more.`;
};
