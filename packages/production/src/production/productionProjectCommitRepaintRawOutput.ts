import path from "node:path";
import { type IAutoMovieRepaintRawOutputPublication, assertAutoMovieRepaintRawOutput, productionRepaintRawOutputReceiptPath } from "./repaintRawOutput";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish validated raw repaint bytes together with their immutable tracked receipt.
 *
 * @evidence contracts/common.md#principled-implementation The raw-output owner validates receipt/bytes before production and absent-receipt checks; the transaction stages output plus receipt and its input guard permits only absence or exact receipt serialization before and after application.
 * @evidence contracts/common.md#clear-and-simple-design Raw publication owns the byte/receipt pair while downstream attempt and rendition owners decide terminal and delivery eligibility; commitFiles supplies atomic staging, namespace checks and rollback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A resident receipt cannot be replaced and another production refuses; the optional input-current check is honored at both transaction boundaries, without substituting a missing receipt for output validation.
 * @evidence contracts/common.md#meaningful-documentation States immutable raw revision, exact receipt guard and returned revision; receipt metadata, retention ceiling, digest, address, ownership and transaction errors propagate. Raw bytes need not be a valid media file and this path performs no media probe or delivery admission.
 * @evidence contracts/performance.md#efficient-algorithms Raw validation hashes supplied bytes and checks receipt text, retention ceiling and canonical address before receipt serialization; commit staging copies new bytes and reads any prior output, and each boundary guard reads/compares resident receipt bytes without media parsing.
 * @evidence contracts/performance.md#reuse-equivalent-work One receipt serialization supplies both staging and exact resident comparisons; supplied output bytes are reused for validation/staging without caching a prior raw-output verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns supplied bytes; staged new/prior buffers and guard receipt copies coexist during the transaction and scale with actual file sizes, while commitFiles releases locks and rollback state on every exit.
 */
export function productionProjectCommitRepaintRawOutput(state: AutoMovieProductionProjectState, publication: IAutoMovieRepaintRawOutputPublication, inputCurrent?: () => boolean): number {
    assertAutoMovieRepaintRawOutput({
        receipt: publication.receipt,
        bytes: publication.bytes,
        requestId: publication.receipt.requestId,
        attemptId: publication.receipt.attemptId,
    });
    if (publication.receipt.productionId !== state.productionId)
        throw new Error("Repaint raw output belongs to another production.");
    const receiptPath: string = productionRepaintRawOutputReceiptPath(publication.receipt.requestId, publication.receipt.attemptId);
    if (productionProjectReadTrackedStateFile(state, receiptPath) !== null)
        throw new Error(`Repaint raw output receipt "${receiptPath}" already exists; raw revisions are immutable.`);
    const receiptContent: string = productionProjectSerializeJson(publication.receipt);
    return productionProjectCommitFiles(state, [
        {
            path: path.join(productionProjectRenderRoot(state), ...publication.receipt.path.split("/")),
            content: publication.bytes,
        },
        {
            path: path.join(state.productionStateRoot, ...receiptPath.split("/")),
            content: receiptContent,
        },
    ],
    // The guard runs before and after the files land, so the resident
    // receipt is either still absent or exactly this publication.
    (): boolean => {
        if ((inputCurrent?.() ?? true) === false)
            return false;
        const resident: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, receiptPath);
        return (resident === null ||
            Buffer.from(resident).equals(Buffer.from(receiptContent, "utf8")));
    });
}
