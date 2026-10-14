import { IAutoMovieScreenplayIndex } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectLoadScreenplayIndex } from "./productionProjectLoadScreenplayIndex";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Read the optional screenplay index under refreshed production identity.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes resident production identity/revision before loading the typed owned screenplay index; missing data remains null and malformed present JSON refuses.
 * @evidence contracts/common.md#clear-and-simple-design This public-read coordinator leaves tracked path and schema ownership to loadScreenplayIndex rather than creating an alternate screenplay ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not regenerate coverage from prose text or silently replace an invalid index; index schema admission is separate from its semantic linkage to authored records.
 * @evidence contracts/common.md#meaningful-documentation Describes optional absence and refreshed acquisition without claiming that the index proves current lexical wording or rendered film behavior.
 * @evidence contracts/performance.md#efficient-algorithms Includes refresh and one index read/parse/schema walk proportional to index bytes and entries; it does not scan screenplay Markdown here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reacquires the index for each call and transfers the result for attempt-local reuse, without treating a previous revision or matching ids as immutable content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned index data survives for its caller; the guarded reader closes its file descriptor and this operation retains no prose, parser or task cache.
 */
export function productionProjectScreenplayIndex(state: AutoMovieProductionProjectState): IAutoMovieScreenplayIndex | null {
    productionProjectRefreshRevision(state);
    return productionProjectLoadScreenplayIndex(state);
}
