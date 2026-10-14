import type { IAutoMovieRepaintRecordTarget } from "./repaintRecordInspection";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectInspectVerifiedRepaintCandidates } from "./productionProjectInspectVerifiedRepaintCandidates";

/**
 * Project the valid candidate receipts from a fresh complete inspection.
 *
 * @evidence contracts/common.md#principled-implementation The existing candidate inspector establishes each admitted resident before this wrapper maps record values; classified findings remain in the richer inspection API and are intentionally not returned by this convenience projection.
 * @evidence contracts/common.md#clear-and-simple-design This narrow receipt-list API shares the inspector's complete validation rather than maintaining a separate permissive discovery path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No receipt is created from a finding and no extra candidate bypasses inspector admission; callers needing reasons or complete-population refusal must use the inspection API.
 * @evidence contracts/common.md#meaningful-documentation Defines valid-sibling projection and optional shot selection; an empty returned list does not distinguish absence from classified invalid records, and uncaught outer inspector errors may propagate.
 * @evidence contracts/performance.md#efficient-algorithms Includes the complete candidate inspector's discovery, byte/currentness and parser costs plus a linear projection over V valid records; mapping alone is not the operation's total cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The inspector's admitted receipt objects are reused without cloning or rerunning validation during projection; no inspection result is retained across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary inspection wrapper/findings become unreachable after projection and V receipt references transfer to the caller; nested readers own descriptor/parser cleanup with no retained inspector task.
 */
export function productionProjectVerifiedRepaintCandidates(state: AutoMovieProductionProjectState, shots?: readonly string[]): IAutoMovieRepaintReceipt[] {
    return productionProjectInspectVerifiedRepaintCandidates(state, shots).records.map((record: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }): IAutoMovieRepaintReceipt => record.value);
}
