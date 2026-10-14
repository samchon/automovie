import type { IAutoMovieRepaintRecordFinding, IAutoMovieRepaintRecordInspection, IAutoMovieRepaintRecordTarget } from "./repaintRecordInspection";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import typia from "typia";
import type { IAutoMovieVerifiedRepaintSelection } from "./IAutoMovieVerifiedRepaintSelection";
import { compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRepaintActiveReceiptPath, productionRepaintReceiptPath } from "./renditionIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { IAutoMovieProductionProjectActiveRepaintReceipt } from "./IAutoMovieProductionProjectActiveRepaintReceipt";
import type { IAutoMovieProductionProjectRepaintSelectionRecord } from "./IAutoMovieProductionProjectRepaintSelectionRecord";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectInspectVerifiedRepaintRenditions } from "./productionProjectInspectVerifiedRepaintRenditions";

/**
 * Return exact selection identities and byte digests only when the requested active inspection has no findings.
 *
 * @evidence contracts/common.md#principled-implementation Complete active inspection must have zero findings before a shot map is built; each sorted distinct admitted shot rereads its pointer and selection, validates exact schemas and receipt identity, then hashes exact resident selection bytes.
 * @evidence contracts/common.md#clear-and-simple-design This strict complete-selection API adds publication identity/digest to active receipt inspection, leaving historical/current-media admission with the existing lineage owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Any classified active finding refuses the whole result; later vanished or mismatching selection records are not silently dropped, and the returned digest is derived from resident bytes rather than serialized metadata.
 * @evidence contracts/common.md#meaningful-documentation Defines strict findings refusal, distinct sorted shots and receipt/selection ID/exact-byte digest output; rereads retain their current observation semantics and do not establish one atomic filesystem snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Includes full active lineage inspections, O(S) shot map construction and O(S log S) distinct-shot sorting; each returned selection adds guarded pointer/selection parsing and full selection-byte hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work The inspection's receipt map serves per-shot lookup and distinct shots are processed once in the projection; required fresh pointer/selection reads remain separate current observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, unique-shot arrays and current pointer/selection buffers are temporary; returned identities, digests and receipt objects transfer to the caller without retaining original selection byte arrays or a task.
 */
export function productionProjectVerifiedRepaintSelections(state: AutoMovieProductionProjectState, shots: readonly string[]): IAutoMovieVerifiedRepaintSelection[] {
    const inspection: IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt> = productionProjectInspectVerifiedRepaintRenditions(state, shots);
    if (inspection.findings.length !== 0)
        throw new Error(`Current repaint selection inspection refused: ${inspection.findings
            .map((finding: IAutoMovieRepaintRecordFinding): string => `${finding.target.shot}:${finding.stage}:${finding.failure}`)
            .join(", ")}.`);
    const receipts: Map<string, IAutoMovieRepaintReceipt> = new Map(inspection.records.map((record: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }): [string, IAutoMovieRepaintReceipt] => [record.value.shot, record.value]));
    return [...new Set(shots)].sort(compareCodeUnits).flatMap((shot: string): { receipt: IAutoMovieRepaintReceipt; selectionId: string; selectionDigest: string; }[] => {
        const receipt: IAutoMovieRepaintReceipt | undefined = receipts.get(shot);
        if (receipt === undefined)
            return [];
        const activeBytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, productionRepaintActiveReceiptPath(shot));
        if (activeBytes === null)
            throw new Error(`Current repaint selection for shot "${shot}" vanished.`);
        const active: typia.IValidation<IAutoMovieProductionProjectActiveRepaintReceipt> = typia.validateEquals<IAutoMovieProductionProjectActiveRepaintReceipt>(parseAutoMovieStructuredJson({
            record: "repaint-active-pointer",
            bytes: activeBytes,
        }));
        if (active.success === false)
            throw new Error(`Current repaint pointer for shot "${shot}" is malformed.`);
        const selectionBytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, active.data.selection);
        if (selectionBytes === null)
            throw new Error(`Current repaint selection for shot "${shot}" vanished.`);
        const selection: typia.IValidation<IAutoMovieProductionProjectRepaintSelectionRecord> = typia.validateEquals<IAutoMovieProductionProjectRepaintSelectionRecord>(parseAutoMovieStructuredJson({
            record: "repaint-selection",
            bytes: selectionBytes,
        }));
        if (selection.success === false ||
            selection.data.selectionId.trim().length === 0 ||
            selection.data.shot !== shot ||
            selection.data.attemptId !== receipt.attemptId ||
            selection.data.candidateReceipt !==
                productionRepaintReceiptPath(receipt.output.path))
            throw new Error(`Current repaint selection for shot "${shot}" does not match its verified candidate.`);
        return [
            {
                receipt,
                selectionId: selection.data.selectionId,
                selectionDigest: digestAutoMovieBytes(selectionBytes),
            },
        ];
    });
}
