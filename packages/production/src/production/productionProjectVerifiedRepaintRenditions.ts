import type { IAutoMovieRepaintRecordTarget } from "./repaintRecordInspection";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectInspectVerifiedRepaintRenditions } from "./productionProjectInspectVerifiedRepaintRenditions";

/**
 * Project currently verified active rendition receipts for the requested shots.
 *
 * @evidence contracts/common.md#principled-implementation The active rendition inspector deduplicates requested targets and validates complete pointer/selection lineage before this wrapper extracts receipt values; classified findings remain available through the inspection API.
 * @evidence contracts/common.md#clear-and-simple-design The convenience receipt list reuses the authoritative active inspector, while consumers requiring strict complete selection use verifiedRepaintSelections or inspect directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid pointer or historical ancestor cannot supply a projected receipt; omission of findings is the defined narrow API and does not establish that every requested shot had a valid active rendition.
 * @evidence contracts/common.md#meaningful-documentation States verified-active projection and findings omission; empty output is not proof of simple absence and uncaught refresh/target validation failures may propagate.
 * @evidence contracts/performance.md#efficient-algorithms Includes requested-shot deduplication/sorting and full per-shot active-lineage inspection plus one O(V) receipt projection; repeated historical byte/currentness costs remain in the delegated inspector.
 * @evidence contracts/performance.md#reuse-equivalent-work Admitted inspector receipt objects are reused in the projection without a second validation pass; fresh active inspection is required on each invocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only projected receipt references escape; temporary target/findings wrappers and historical parse/output buffers are released by their owners, without a persistent active-rendition store or task.
 */
export function productionProjectVerifiedRepaintRenditions(state: AutoMovieProductionProjectState, shots: readonly string[]): IAutoMovieRepaintReceipt[] {
    return productionProjectInspectVerifiedRepaintRenditions(state, shots).records.map((record: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }): IAutoMovieRepaintReceipt => record.value);
}
