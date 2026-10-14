import type { IAutoMovieProductionRenderReceipt } from "@automovie/interface";
import typia from "typia";
import { admitProductionRenderLedgerValidation } from "./admitProductionRenderLedgerValidation";

/**
 * Admit materialized renderer receipt data through its exact structural schema.
 *
 * @evidence contracts/common.md#principled-implementation Configured typia validates exact receipt structure and additional properties before the shared success/refusal projection.
 * @evidence contracts/common.md#clear-and-simple-design Owns receipt schema separately from manifest admission and downstream digest/current-plan comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed shape is not authenticity or currentness, and failed data receives no default receipt or unsafe cast.
 * @evidence contracts/common.md#meaningful-documentation States unknown input, same-reference success and typed refusal used after receipt JSON ingress.
 * @evidence contracts/performance.md#efficient-algorithms Exact validation traverses all receipt files and fields; population and error path/expected text determine work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One materialized receipt supplies one schema pass without copying its file list or reusing earlier verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Data returns by reference; failed validation transfers projected strings to the Error, with no retained native handle or task.
 */
export function assertProductionRenderReceiptRecord(value: unknown): IAutoMovieProductionRenderReceipt {
  return admitProductionRenderLedgerValidation("render-manifest-receipt", typia.validateEquals<IAutoMovieProductionRenderReceipt>(value));
}
