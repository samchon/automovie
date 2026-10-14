import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectLoadGraph } from "./productionProjectLoadGraph";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Acquire the current typed design graph after refreshing its production fence.
 *
 * @evidence contracts/common.md#principled-implementation Checks root, incarnation and revision before loading owned production, shared and keyed design records; each resident record must pass its schema admission.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates refresh and graph loading without a second graph model or cache, preserving the original public graph read sequence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential file reads are not claimed to be an atomic snapshot; no graph or production is substituted after a read/schema refusal.
 * @evidence contracts/common.md#meaningful-documentation A typed graph records admitted resident designs and optional absence, while separate graph validation decides cross-record semantic validity.
 * @evidence contracts/performance.md#efficient-algorithms Includes refresh plus directory enumeration, ordered keyed-design reads and JSON schema validation proportional to resident record bytes and keyed populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns one loaded graph for the caller to reuse; independent calls reacquire records and do not equate same ids or revision with frozen bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph maps and parsed records transfer to the caller; readers close their file handles and this coordinator retains no additional graph or task.
 */
export function productionProjectGraph(state: AutoMovieProductionProjectState): IAutoMovieProductionDesignGraph {
    productionProjectRefreshRevision(state);
    return productionProjectLoadGraph(state);
}
