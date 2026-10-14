import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import path from "node:path";
import typia from "typia";
import { productionRepaintReceiptPath } from "./renditionIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectAssertCurrentRepaintReceipt } from "./productionProjectAssertCurrentRepaintReceipt";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish a current delivery-admissible repaint clip with its tracked candidate receipt.
 *
 * @evidence contracts/common.md#principled-implementation Exact v4 schema admission precedes full current-receipt/byte validation; the render output and canonical tracked receipt paths are then staged together through the existing transaction with the optional input-current callback.
 * @evidence contracts/common.md#clear-and-simple-design Candidate publication composes current compile/source/attempt/reference/media owners and the transaction owner; active selection remains a later explicit operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid or stale clip cannot be made current by publishing its receipt; no media rewrite, profile tolerance or implicit active-selection pointer is introduced.
 * @evidence contracts/common.md#meaningful-documentation States candidate byte/receipt publication, revision result and optional transaction currentness; schema, source/attempt/reference/media and mutation refusals propagate.
 * @evidence contracts/performance.md#efficient-algorithms Includes all current-receipt dependencies: current graph/manifest and reference populations, source bundle frame/mask observations, attempt ledger, output hashing and separate MP4 probe/splice admission, then staged new/prior byte copies.
 * @evidence contracts/performance.md#reuse-equivalent-work The same admitted receipt and caller bytes feed verification and publication; validation is not cached across revisions and the commit callback remains the caller's publication-currentness authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller bytes remain borrowed during validation; graph/ledger/parser objects and staged new/prior buffers scale with actual inputs and expire with the synchronous transaction, whose owner releases locks and descriptors.
 */
export function productionProjectCommitRepaintRendition(state: AutoMovieProductionProjectState, receipt: IAutoMovieRepaintReceipt, bytes: Uint8Array, inputCurrent?: () => boolean): number {
    const validation: typia.IValidation<IAutoMovieRepaintReceipt> = typia.validateEquals<IAutoMovieRepaintReceipt>(receipt);
    if (validation.success === false)
        throw new Error("Repaint receipt does not match its strict v4 schema.");
    productionProjectAssertCurrentRepaintReceipt(state, receipt, bytes);
    const output: string = resolveInside(productionProjectRenderRoot(state), receipt.output.path);
    const tracked: string = path.join(state.productionStateRoot, ...productionRepaintReceiptPath(receipt.output.path).split("/"));
    return productionProjectCommitFiles(state, [
        { path: output, content: bytes },
        { path: tracked, content: productionProjectSerializeJson(receipt) },
    ], inputCurrent);
}
