import type { IAutoMovieRepaintRecordFinding, IAutoMovieRepaintRecordInspection, IAutoMovieRepaintRecordTarget } from "./repaintRecordInspection";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";
import { randomUUID } from "node:crypto";
import path from "node:path";
import typia from "typia";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRepaintActiveReceiptPath, productionRepaintReceiptPath } from "./renditionIdentity";
import { assertAutoMovieRepaintExecutionPolicy } from "./repaintExecution";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { IAutoMovieProductionProjectActiveRepaintReceipt } from "./IAutoMovieProductionProjectActiveRepaintReceipt";
import type { IAutoMovieProductionProjectRepaintSelectionRecord } from "./IAutoMovieProductionProjectRepaintSelectionRecord";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectRepaintSelectionPath } from "./productionProjectRepaintSelectionPath";
import { productionProjectTrimmedText } from "./productionProjectTrimmedText";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectVerifiedRepaintCandidates } from "./productionProjectVerifiedRepaintCandidates";
import { productionProjectInspectVerifiedRepaintCandidates } from "./productionProjectInspectVerifiedRepaintCandidates";
import { productionProjectVerifiedRepaintRenditions } from "./productionProjectVerifiedRepaintRenditions";
import { productionProjectInspectVerifiedRepaintRenditions } from "./productionProjectInspectVerifiedRepaintRenditions";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Record an explicit candidate selection or reversal and update the active pointer under guarded lineage agreement.
 *
 * @evidence contracts/common.md#principled-implementation Candidate and active inspections precede exact UTC chronology, reason/structural/continuity evidence and forward-versus-reversal checks; one selection record and pointer are staged while current candidate and active lineage are reobserved before/after publication.
 * @evidence contracts/common.md#clear-and-simple-design Selection owns user review metadata and pointer lineage, candidate inspection owns resident admissibility, and commitFiles owns revision locking and rollback without a new active-state cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing requested candidates and invalid active lineage refuse; reversal requires an older completed candidate and an existing active selection, and named passing review strings do not substitute for candidate byte verification.
 * @evidence contracts/common.md#meaningful-documentation Defines selection versus reversal chronology, required evidence agreement, atomic record/pointer update and returned receipt; boundary input-current and candidate/active identity failures abort the transaction.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete candidate discovery and active historical-lineage verification, linear candidate searches and canonical metadata work; boundary callbacks repeat candidate and active inspections, including all nested byte/parser/ledger costs rather than only two writes.
 * @evidence contracts/performance.md#reuse-equivalent-work Candidate and previous-active canonical identities are reused as boundary comparison bases; current inspected receipts and pointers are freshly observed instead of treating the chosen attempt ID as equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate arrays, active lineage and canonical strings remain local through the transaction; the two staged records and prior bytes are owned by commitFiles and the selected receipt escapes without retaining inspector buffers or a task.
 */
export function productionProjectSelectRepaintCandidate(state: AutoMovieProductionProjectState, props: {
    shot: string;
    attemptId: string;
    kind: "selection" | "reversal";
    reason: string;
    structuralReview: string;
    continuityReview: IAutoMovieProductionProjectRepaintSelectionRecord["continuityReview"];
    selectedAt: string;
    inputCurrent?: () => boolean;
}): IAutoMovieRepaintReceipt {
    const candidateInspection: IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt> = productionProjectInspectVerifiedRepaintCandidates(state, [
        props.shot,
    ]);
    const candidates: IAutoMovieRepaintReceipt[] = candidateInspection.records.map((record: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }): IAutoMovieRepaintReceipt => record.value);
    const receipt: IAutoMovieRepaintReceipt | undefined = candidates.find((candidate: IAutoMovieRepaintReceipt): boolean => candidate.attemptId === props.attemptId);
    if (receipt === undefined && candidateInspection.findings.length !== 0)
        throw new Error(`Repaint candidate inspection refused: ${candidateInspection.findings
            .map((finding: IAutoMovieRepaintRecordFinding): string => `${finding.target.recordId}:${finding.stage}:${finding.failure}`)
            .join(", ")}.`);
    if (receipt === undefined)
        throw new Error(`Repaint candidate "${props.attemptId}" is absent, invalid, or stale for shot "${props.shot}".`);
    const selectedAt: Date = new Date(props.selectedAt);
    if (Number.isNaN(selectedAt.getTime()) ||
        selectedAt.toISOString() !== props.selectedAt)
        throw new Error("Repaint selection requires an exact UTC instant.");
    if (selectedAt.getTime() < new Date(receipt.completedAt!).getTime())
        throw new Error("Repaint selection cannot precede the candidate completion instant.");
    assertAutoMovieRepaintExecutionPolicy(receipt.executionPolicy!);
    const reason: string = productionProjectTrimmedText(props.reason, "Repaint selection reason");
    const structuralReview: string = productionProjectTrimmedText(props.structuralReview, "Repaint structural review evidence");
    const continuityReview: { baseline: string; playbackEvidence: string; mixedDeliveryPolicy: string | null; flicker: "pass"; identityDrift: "pass"; geometryWarp: "pass"; textureCrawl: "pass"; transitionMismatch: "pass"; } | null = props.continuityReview;
    if (continuityReview !== null) {
        productionProjectTrimmedText(continuityReview.baseline, "Repaint continuity baseline");
        productionProjectTrimmedText(continuityReview.playbackEvidence, "Repaint sequence playback evidence");
        if (continuityReview.mixedDeliveryPolicy !== null)
            productionProjectTrimmedText(continuityReview.mixedDeliveryPolicy, "Repaint mixed-delivery transition policy");
        if (continuityReview.flicker !== "pass" ||
            continuityReview.identityDrift !== "pass" ||
            continuityReview.geometryWarp !== "pass" ||
            continuityReview.textureCrawl !== "pass" ||
            continuityReview.transitionMismatch !== "pass")
            throw new Error("Repaint continuity selection requires passing flicker, identity drift, geometry warp, texture crawl, and transition mismatch observations.");
    }
    if (receipt.evidence!.continuity === null
        ? continuityReview !== null
        : continuityReview === null ||
            continuityReview.baseline !== receipt.evidence!.continuity)
        throw new Error("Repaint continuity selection must match the candidate continuity evidence exactly.");
    const activePath: string = productionRepaintActiveReceiptPath(props.shot);
    const activeInspection: IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt> = productionProjectInspectVerifiedRepaintRenditions(state, [
        props.shot,
    ]);
    const activeFailures: IAutoMovieRepaintRecordFinding[] = activeInspection.findings.filter((finding: IAutoMovieRepaintRecordFinding): boolean => finding.failure !== "absent");
    if (activeFailures.length !== 0)
        throw new Error(`Current repaint selection inspection refused: ${activeFailures
            .map((finding: IAutoMovieRepaintRecordFinding): string => `${finding.stage}:${finding.failure}`)
            .join(", ")}.`);
    const verifiedActive: IAutoMovieRepaintReceipt | undefined = activeInspection.records[0]?.value;
    const activeBytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, activePath);
    let previousSelection: string | null = null;
    let previousCandidate: IAutoMovieRepaintReceipt | undefined;
    if (activeBytes !== null) {
        const previous: typia.IValidation<IAutoMovieProductionProjectActiveRepaintReceipt> = typia.validateEquals<IAutoMovieProductionProjectActiveRepaintReceipt>(parseAutoMovieStructuredJson({
            record: "repaint-active-pointer",
            bytes: activeBytes,
        }));
        if (previous.success === false || previous.data.shot !== props.shot)
            throw new Error("Current repaint selection pointer is malformed.");
        previousSelection = previous.data.selection;
        previousCandidate = candidates.find((candidate: IAutoMovieRepaintReceipt): boolean => productionRepaintReceiptPath(candidate.output.path) ===
            previous.data.receipt &&
            candidate.output.path === previous.data.output);
        if (previousCandidate === undefined ||
            verifiedActive?.attemptId !== previousCandidate.attemptId)
            throw new Error("Current repaint selection pointer does not name an active verified selection.");
    }
    if (props.kind === "reversal") {
        if (previousSelection === null || previousCandidate === undefined)
            throw new Error("Repaint reversal requires an existing active verified selection.");
        if (new Date(receipt.completedAt!).getTime() >=
            new Date(previousCandidate.completedAt!).getTime())
            throw new Error("Repaint reversal requires a candidate completed before the current active candidate.");
    }
    else if (previousCandidate !== undefined &&
        new Date(receipt.completedAt!).getTime() <=
            new Date(previousCandidate.completedAt!).getTime())
        throw new Error("Repaint selection requires a candidate completed after the current active candidate; use reversal for an older candidate.");
    const selectionId: `${string}-${string}-${string}-${string}-${string}` = randomUUID();
    const selectionPath: string = productionProjectRepaintSelectionPath(props.shot, selectionId);
    const candidateReceipt: string = productionRepaintReceiptPath(receipt.output.path);
    const selection: IAutoMovieProductionProjectRepaintSelectionRecord = {
        version: 1,
        selectionId,
        kind: props.kind,
        productionId: state.productionId,
        shot: props.shot,
        requestId: receipt.requestId!,
        attemptId: receipt.attemptId,
        selectedAt: props.selectedAt,
        candidateReceipt,
        output: receipt.output.path,
        previousSelection,
        reason,
        structuralReview,
        continuityReview: structuredClone(continuityReview),
    };
    const pointer: IAutoMovieProductionProjectActiveRepaintReceipt = {
        version: 2,
        shot: props.shot,
        selection: selectionPath,
        receipt: candidateReceipt,
        output: receipt.output.path,
    };
    const previousIdentity: string | null = activeBytes?.toString() ?? null;
    const nextIdentity: string = productionProjectSerializeJson(pointer);
    const candidateIdentity: string = canonicalizeAutoMovieJson(receipt);
    const previousCandidateIdentity: string | null = previousCandidate === undefined
        ? null
        : canonicalizeAutoMovieJson(previousCandidate);
    productionProjectCommitFiles(state, [
        {
            path: path.join(state.productionStateRoot, ...selectionPath.split("/")),
            content: productionProjectSerializeJson(selection),
        },
        {
            path: path.join(state.productionStateRoot, ...activePath.split("/")),
            content: nextIdentity,
        },
    ], (): boolean => {
        if ((props.inputCurrent?.() ?? true) === false)
            return false;
        const currentCandidate: IAutoMovieRepaintReceipt | undefined = productionProjectVerifiedRepaintCandidates(state, [
            props.shot,
        ]).find((candidate: IAutoMovieRepaintReceipt): boolean => candidate.attemptId === props.attemptId);
        const activeIdentity: string | null = productionProjectReadTrackedStateFile(state, activePath)?.toString() ?? null;
        const currentActive: IAutoMovieRepaintReceipt | undefined = productionProjectVerifiedRepaintRenditions(state, [props.shot])[0];
        const activeLineageCurrent: boolean = activeIdentity === null
            ? previousIdentity === null && currentActive === undefined
            : activeIdentity === previousIdentity
                ? currentActive !== undefined &&
                    previousCandidateIdentity !== null &&
                    canonicalizeAutoMovieJson(currentActive) ===
                        previousCandidateIdentity
                : activeIdentity === nextIdentity &&
                    currentActive !== undefined &&
                    canonicalizeAutoMovieJson(currentActive) === candidateIdentity;
        return (currentCandidate !== undefined &&
            canonicalizeAutoMovieJson(currentCandidate) === candidateIdentity &&
            activeLineageCurrent);
    });
    return receipt;
}
