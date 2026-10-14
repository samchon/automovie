import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import typia from "typia";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRepaintReceiptPath } from "./renditionIdentity";
import { AutoMovieRepaintRecordInspectionError } from "./repaintRecordInspection";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { IAutoMovieProductionProjectRepaintSelectionRecord } from "./IAutoMovieProductionProjectRepaintSelectionRecord";
import { productionProjectRepaintSelectionPath } from "./productionProjectRepaintSelectionPath";
import { productionProjectSafeProjectErrorMessage } from "./productionProjectSafeProjectErrorMessage";
import { productionProjectClassifyCurrentRepaintReceiptError } from "./productionProjectClassifyCurrentRepaintReceiptError";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectAssertCurrentRepaintReceipt } from "./productionProjectAssertCurrentRepaintReceipt";

/**
 * Walk a selection's complete predecessor chain and return its first receipt only after every ancestor remains admissible.
 *
 * @evidence contracts/common.md#principled-implementation A visited-path Set rejects cycles; each selection and candidate passes guarded parse/schema, canonical address and request/output agreement, exact timestamp/review checks, child chronology and current byte/media validation before the predecessor link is followed.
 * @evidence contracts/common.md#clear-and-simple-design This iterative history owner serves active pointer inspection and isolates classified selection/receipt/output failures; current receipt verification stays with the shared validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No earlier ancestor is accepted solely because the first candidate is current; cycles and reversals without predecessors refuse, and locator error-text classification retains its existing heuristic limits.
 * @evidence contracts/common.md#meaningful-documentation Defines complete history admission, first-receipt return, forward/reversal chronology and classified stages; an empty chain is absent and any invalid ancestor refuses the selected result.
 * @evidence contracts/performance.md#efficient-algorithms For L ancestors, work sums all selection/receipt/output bytes and full current-receipt dependencies; visited paths use O(L) storage, while repeated source/reference/request parsing across ancestors is preserved without an unsupported constant-time or single-read claim.
 * @evidence contracts/performance.md#reuse-equivalent-work The current child timestamps/selection and first admitted receipt are reused during the iterative walk, and visited membership avoids an infinite cycle without caching successful historical currentness across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Visited paths and the selected first receipt remain live to completion; current ancestor records, output and parser objects are transient, nested readers close descriptors and no recursive task or persistent lineage cache is retained.
 */
export function productionProjectVerifiedRepaintSelectionLineage(state: AutoMovieProductionProjectState, props: {
    shot: string;
    selectionPath: string;
}): IAutoMovieRepaintReceipt {
    const visited: Set<string> = new Set<string>();
    let selectionPath: string | null = props.selectionPath;
    let child: {
        selection: IAutoMovieProductionProjectRepaintSelectionRecord;
        selectedAt: number;
        completedAt: number;
    } | undefined;
    let selected: IAutoMovieRepaintReceipt | null = null;
    while (selectionPath !== null) {
        if (visited.has(selectionPath))
            throw new AutoMovieRepaintRecordInspectionError("selection", "identity-invalid");
        visited.add(selectionPath);
        let selectionBytes: Uint8Array | null;
        try {
            selectionBytes = productionProjectReadTrackedStateFile(state, selectionPath);
        }
        catch (error) {
            throw new AutoMovieRepaintRecordInspectionError("selection", productionProjectSafeProjectErrorMessage(error).toLowerCase().includes("link")
                ? "unsafe-locator"
                : "unavailable");
        }
        if (selectionBytes === null)
            throw new AutoMovieRepaintRecordInspectionError("selection", "absent");
        let selectionValue: unknown;
        try {
            selectionValue = parseAutoMovieStructuredJson({
                record: "repaint-selection",
                bytes: selectionBytes,
            });
        }
        catch {
            throw new AutoMovieRepaintRecordInspectionError("selection", "schema-invalid");
        }
        const selectionValidation: typia.IValidation<IAutoMovieProductionProjectRepaintSelectionRecord> = typia.validateEquals<IAutoMovieProductionProjectRepaintSelectionRecord>(selectionValue);
        if (selectionValidation.success === false)
            throw new AutoMovieRepaintRecordInspectionError("selection", "schema-invalid");
        const selection: IAutoMovieProductionProjectRepaintSelectionRecord = selectionValidation.data;
        let receiptBytes: Uint8Array | null;
        try {
            receiptBytes = productionProjectReadTrackedStateFile(state, selection.candidateReceipt);
        }
        catch (error) {
            throw new AutoMovieRepaintRecordInspectionError("receipt", productionProjectSafeProjectErrorMessage(error).toLowerCase().includes("link")
                ? "unsafe-locator"
                : "unavailable");
        }
        if (receiptBytes === null)
            throw new AutoMovieRepaintRecordInspectionError("receipt", "absent");
        let receiptValue: unknown;
        try {
            receiptValue = parseAutoMovieStructuredJson({
                record: "repaint-candidate-receipt",
                bytes: receiptBytes,
            });
        }
        catch {
            throw new AutoMovieRepaintRecordInspectionError("receipt", "schema-invalid");
        }
        const receiptValidation: typia.IValidation<IAutoMovieRepaintReceipt> = typia.validateEquals<IAutoMovieRepaintReceipt>(receiptValue);
        if (receiptValidation.success === false)
            throw new AutoMovieRepaintRecordInspectionError("receipt", "schema-invalid");
        const receipt: IAutoMovieRepaintReceipt = receiptValidation.data;
        const selectedAt: Date = new Date(selection.selectedAt);
        const completedAt: Date = new Date(receipt.completedAt ?? Number.NaN);
        if (selection.productionId !== state.productionId ||
            selection.shot !== props.shot ||
            receipt.shot !== props.shot ||
            selectionPath !==
                productionProjectRepaintSelectionPath(props.shot, selection.selectionId) ||
            selection.requestId !== receipt.requestId ||
            selection.attemptId !== receipt.attemptId ||
            selection.candidateReceipt !==
                productionRepaintReceiptPath(receipt.output.path) ||
            selection.output !== receipt.output.path ||
            Number.isNaN(selectedAt.getTime()) ||
            selectedAt.toISOString() !== selection.selectedAt ||
            Number.isNaN(completedAt.getTime()) ||
            selectedAt.getTime() < completedAt.getTime() ||
            selection.reason.trim().length === 0 ||
            selection.reason !== selection.reason.trim() ||
            selection.structuralReview.trim().length === 0 ||
            selection.structuralReview !== selection.structuralReview.trim() ||
            (receipt.evidence?.continuity === null
                ? selection.continuityReview !== null
                : selection.continuityReview === null ||
                    selection.continuityReview.baseline !==
                        receipt.evidence?.continuity ||
                    selection.continuityReview.playbackEvidence.trim().length === 0 ||
                    selection.continuityReview.playbackEvidence !==
                        selection.continuityReview.playbackEvidence.trim() ||
                    (selection.continuityReview.mixedDeliveryPolicy !== null &&
                        (selection.continuityReview.mixedDeliveryPolicy.trim().length ===
                            0 ||
                            selection.continuityReview.mixedDeliveryPolicy !==
                                selection.continuityReview.mixedDeliveryPolicy.trim()))) ||
            (child !== undefined &&
                (child.selectedAt < selectedAt.getTime() ||
                    (child.selection.kind === "reversal"
                        ? child.completedAt >= completedAt.getTime()
                        : child.completedAt <= completedAt.getTime()))) ||
            (selection.previousSelection === null && selection.kind === "reversal"))
            throw new AutoMovieRepaintRecordInspectionError("selection", "identity-invalid");
        let output: Uint8Array;
        try {
            output = productionProjectReadRenderFile(state, receipt.output.path);
        }
        catch (error) {
            throw new AutoMovieRepaintRecordInspectionError("output", productionProjectSafeProjectErrorMessage(error).toLowerCase().includes("link")
                ? "unsafe-locator"
                : "unavailable");
        }
        try {
            productionProjectAssertCurrentRepaintReceipt(state, receipt, output);
        }
        catch (error) {
            const classified: { stage: "receipt" | "currentness" | "output"; failure: "identity-invalid" | "stale" | "render-corrupt"; } = productionProjectClassifyCurrentRepaintReceiptError(error);
            throw new AutoMovieRepaintRecordInspectionError(classified.stage, classified.failure);
        }
        selected ??= receipt;
        child = {
            selection,
            selectedAt: selectedAt.getTime(),
            completedAt: completedAt.getTime(),
        };
        selectionPath = selection.previousSelection;
    }
    if (selected === null)
        throw new AutoMovieRepaintRecordInspectionError("selection", "absent");
    return selected;
}
