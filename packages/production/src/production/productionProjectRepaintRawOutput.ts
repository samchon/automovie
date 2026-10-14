import typia from "typia";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { type IAutoMovieRepaintRawOutputPublication, type IAutoMovieRepaintRawOutputReceipt, assertAutoMovieRepaintRawOutput, productionRepaintRawOutputReceiptPath } from "./repaintRawOutput";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";

/**
 * Read and revalidate one resident raw-output receipt and its exact render bytes.
 *
 * @evidence contracts/common.md#principled-implementation Canonical request/attempt receipt addressing leads to a guarded resident read, duplicate-aware parsing and exact schema; the recorded output bytes then pass the shared raw-output validator for both requested identities.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns current resident publication observation, using the same validation policy as raw publication rather than inventing another receipt protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or malformed receipt throws and a stored digest alone cannot prove resident bytes; output-read and raw-validation failures propagate without empty-byte or prior-result substitution, and raw retention does not imply media validity.
 * @evidence contracts/common.md#meaningful-documentation Defines required receipt/output presence, request/attempt identity and returned byte ownership; successful return describes the observed raw revision, not a final deliverable or future unchanged state.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes repeated tracked/render namespace admission, receipt parsing and the full B-byte output read/hash plus receipt text/address checks; no media box or sample parsing occurs in this raw-retention reader.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted receipt supplies the resident output locator and validator inputs within this read; fresh bytes are required instead of reusing a previous request/attempt verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded readers close descriptors and temporary receipt parse/validation state expires; receipt and full output bytes transfer to the caller, with no retained JSON parser, receipt cache or provider task.
 */
export function productionProjectRepaintRawOutput(state: AutoMovieProductionProjectState, requestId: string, attemptId: string): IAutoMovieRepaintRawOutputPublication {
    const receiptPath: string = productionRepaintRawOutputReceiptPath(requestId, attemptId);
    const resident: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, receiptPath);
    if (resident === null)
        throw new Error(`Repaint raw output receipt "${receiptPath}" is absent.`);
    const decoded: typia.IValidation<IAutoMovieRepaintRawOutputReceipt> = typia.validateEquals<IAutoMovieRepaintRawOutputReceipt>(parseAutoMovieStructuredJson({
        record: "repaint-raw-output-receipt",
        bytes: resident,
    }));
    if (decoded.success === false)
        throw new Error(`Repaint raw output receipt "${receiptPath}" is malformed.`);
    const bytes: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, decoded.data.path);
    assertAutoMovieRepaintRawOutput({
        receipt: decoded.data,
        bytes,
        requestId,
        attemptId,
    });
    return { receipt: decoded.data, bytes };
}
