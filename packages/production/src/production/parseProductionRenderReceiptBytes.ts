import type { IAutoMovieProductionRenderReceipt } from "@automovie/interface";
import { parseAutoMovieStructuredJson } from "./parseAutoMovieStructuredJson";
import { assertProductionRenderReceiptRecord } from "./assertProductionRenderReceiptRecord";

/**
 * Decode persisted receipt bytes through strict JSON ingress before exact schema admission.
 *
 * @evidence contracts/common.md#principled-implementation Strict UTF-8 and duplicate-aware JSON materialization precede receipt validation; delivery separately binds manifest digest and publication fingerprint to the current plan.
 * @evidence contracts/common.md#clear-and-simple-design Composes canonical ingress and receipt schema rather than maintaining another parser or decoding policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid encoding, grammar, duplicates and schema refuse without invented fields; shape does not establish byte ownership or currentness.
 * @evidence contracts/common.md#meaningful-documentation States byte input and admitted receipt, with failures propagated to delivery's unowned-publication classification.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete byte decoding, JSON materialization and field validation; suffix slicing can add quadratic text copies and complete populations have no byte cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work One JSON tree supplies validation and return without a repeated parse or persisted-path verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bytes remain borrowed, decoded text/frames expire and data transfers; error descriptions stay with catching callers, with no descriptor or persistent task.
 */
export function parseProductionRenderReceiptBytes(bytes: Uint8Array): IAutoMovieProductionRenderReceipt {
  return assertProductionRenderReceiptRecord(parseAutoMovieStructuredJson({ record: "render-manifest-receipt", bytes }));
}
