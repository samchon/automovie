import type { IAutoMovieProductionProjectSummary } from "./IAutoMovieProductionProjectSummary";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectProductionIds } from "./productionProjectProductionIds";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Project opening metadata and a current registry observation into a summary.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes state before assembling root, active id, format, revision and initialization status, and delegates current production ids to the registry reader which refreshes again in the original order.
 * @evidence contracts/common.md#clear-and-simple-design Summary is a read projection of existing state and registry facts; it introduces no separate summary ledger or mutation service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the nested refresh rather than assuming the first check covers a later registry read; observations across files are not an atomic snapshot.
 * @evidence contracts/common.md#meaningful-documentation Opening-time initialized/format fields and refreshed revision/registry fields have distinct lifetimes, so the summary does not assert all fields were acquired simultaneously.
 * @evidence contracts/performance.md#efficient-algorithms Includes two refresh paths and one complete registry admission/copy, with registry bytes and production count driving the dominant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares immutable opening metadata while acquiring resident registry and revision again; the duplicated guard is retained to preserve existing observation order.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned object and its production-id array belong to the caller; no summary cache, handle or running task is retained.
 */
export function productionProjectSummary(state: AutoMovieProductionProjectState): IAutoMovieProductionProjectSummary {
    productionProjectRefreshRevision(state);
    return {
        root: state.root,
        productionId: state.productionId,
        productions: productionProjectProductionIds(state),
        formatVersion: state.manifest_.formatVersion,
        revision: state.lastReadRevision_,
        initialized: state.initialized_,
    };
}
