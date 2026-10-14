
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import typia, { type IValidation } from "typia";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRepaintActiveReceiptPath, productionRepaintReceiptPath } from "./renditionIdentity";
import { type IAutoMovieRepaintRecordTarget, AutoMovieRepaintRecordInspectionError, type IAutoMovieRepaintRecordInspection, inspectAutoMovieRepaintRecords } from "./repaintRecordInspection";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { IAutoMovieProductionProjectActiveRepaintReceipt } from "./IAutoMovieProductionProjectActiveRepaintReceipt";
import { productionProjectSafeProjectErrorMessage } from "./productionProjectSafeProjectErrorMessage";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectVerifiedRepaintSelectionLineage } from "./productionProjectVerifiedRepaintSelectionLineage";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Inspect each distinct requested active pointer and its complete verified selection ancestry.
 *
 * @evidence contracts/common.md#principled-implementation Revision refresh and distinct target construction precede guarded pointer parsing/schema; full historical lineage returns the selected receipt and canonical pointer comparison binds its selection, receipt and output before it is admitted.
 * @evidence contracts/common.md#clear-and-simple-design The shared inspection collector preserves valid siblings and safe findings, while this adapter owns pointer admission and the lineage reader owns historical selection/receipt/currentness checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching output name alone cannot establish active ownership; malformed pointers or failed history become classified refusals, with the existing link-text locator heuristic retained rather than strengthened by a claim.
 * @evidence contracts/common.md#meaningful-documentation Defines deduplicated active-shot targets, pointer and lineage refusal stages and canonical expected pointer; missing pointers are absent findings and initial revision/target errors can propagate.
 * @evidence contracts/performance.md#efficient-algorithms Distinct S shot targets are copied/sorted and each pointer parsed/canonicalized; total cost includes every selection ancestor's record/output reads and current-receipt dependencies, which can repeat shared request/reference/source observations across shots.
 * @evidence contracts/performance.md#reuse-equivalent-work Requested shots are deduplicated before inspection and one lineage-selected receipt supplies expected pointer fields; no prior pointer or lineage success bypasses current resident observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Targets, pointer bytes, historical sets and per-target parser/output buffers are local; admitted receipts and safe findings transfer to the caller while nested readers close descriptors and no inspector cache survives.
 */
export function productionProjectInspectVerifiedRepaintRenditions(state: AutoMovieProductionProjectState, shots: readonly string[]): IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt> {
    productionProjectRefreshRevision(state);
    return inspectAutoMovieRepaintRecords({
        targets: [...new Set(shots)].map((shot: string): { kind: "rendition"; shot: string; recordId: string; } => ({
            kind: "rendition" as const,
            shot,
            recordId: "active",
        })),
        inspect: (target: IAutoMovieRepaintRecordTarget): IAutoMovieRepaintReceipt | null => {
            const shot: string = target.shot;
            const activePath: string = productionRepaintActiveReceiptPath(shot);
            let activeBytes: Uint8Array | null;
            try {
                activeBytes = productionProjectReadTrackedStateFile(state, activePath);
            }
            catch (error) {
                throw new AutoMovieRepaintRecordInspectionError("pointer", productionProjectSafeProjectErrorMessage(error).toLowerCase().includes("link")
                    ? "unsafe-locator"
                    : "unavailable");
            }
            if (activeBytes === null)
                return null;
            let pointerValidation: IValidation<IAutoMovieProductionProjectActiveRepaintReceipt>;
            try {
                pointerValidation =
                    typia.validateEquals<IAutoMovieProductionProjectActiveRepaintReceipt>(parseAutoMovieStructuredJson({
                        record: "repaint-active-pointer",
                        bytes: activeBytes,
                    }));
            }
            catch {
                throw new AutoMovieRepaintRecordInspectionError("pointer", "schema-invalid");
            }
            if (pointerValidation.success === false)
                throw new AutoMovieRepaintRecordInspectionError("pointer", "schema-invalid");
            const pointer: IAutoMovieProductionProjectActiveRepaintReceipt = pointerValidation.data;
            let receipt: IAutoMovieRepaintReceipt;
            try {
                receipt = productionProjectVerifiedRepaintSelectionLineage(state, {
                    shot,
                    selectionPath: pointer.selection,
                });
            }
            catch (error) {
                if (error instanceof AutoMovieRepaintRecordInspectionError)
                    throw error;
                throw new AutoMovieRepaintRecordInspectionError("selection", "unavailable");
            }
            if (canonicalizeAutoMovieJson(pointer) !==
                canonicalizeAutoMovieJson({
                    version: 2,
                    shot,
                    selection: pointer.selection,
                    receipt: productionRepaintReceiptPath(receipt.output.path),
                    output: receipt.output.path,
                } satisfies IAutoMovieProductionProjectActiveRepaintReceipt))
                throw new AutoMovieRepaintRecordInspectionError("pointer", "identity-invalid");
            return receipt;
        },
    });
}
