import type { IAutoMovieRepaintRecordTarget, IAutoMovieRepaintRecordFinding, IAutoMovieRepaintRecordInspection } from "./repaintRecordInspection";
import type { Stats, Dirent } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieRepaintReceipt } from "@automovie/interface";

import path from "node:path";
import typia from "typia";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRepaintReceiptPath } from "./renditionIdentity";

import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSafeProjectErrorMessage } from "./productionProjectSafeProjectErrorMessage";
import { productionProjectClassifyCurrentRepaintReceiptError } from "./productionProjectClassifyCurrentRepaintReceiptError";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectAssertCurrentRepaintReceipt } from "./productionProjectAssertCurrentRepaintReceipt";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Inspect all resident candidate JSON siblings and retain valid records alongside safe classified findings.
 *
 * @evidence contracts/common.md#principled-implementation Revision refresh precedes sorted discovery; resident shape, duplicate-aware parse, exact schema, canonical address, output read and current receipt checks each produce their existing stage/failure before admitted records are sorted by shot/completion/attempt.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns candidate population and independent sibling findings, delegating bytes and currentness to existing readers/validators; optional shot filtering occurs only after receipt schema admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid siblings stay visible as safe findings and do not erase valid siblings; output locator classification retains the existing error-text heuristic and is not represented as a typed filesystem cause proof.
 * @evidence contracts/common.md#meaningful-documentation Defines empty/linked/unavailable enumeration, unresolved identity before decoding, post-schema shot filtering and safe built-in recovery; outer revision/lstat failures can still throw outside sibling classification.
 * @evidence contracts/performance.md#efficient-algorithms E directory entries and V admitted records are separately sorted; each selected receipt incurs guarded JSON/output reads and full current-receipt dependencies, including attempt/reference/source populations and media/sample parsing. Even unselected malformed receipts reach shape/parse/schema work.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected-shot Set supports repeated membership checks and each decoded receipt feeds address/currentness admission and returned records; mutable filesystem facts are not cached across inspections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Discovery, selected-shot membership and record/finding arrays scale with observed population; output bytes and parser objects are per-sibling temporaries and returned receipts/findings retain no payload buffers or provider tasks.
 */
export function productionProjectInspectVerifiedRepaintCandidates(state: AutoMovieProductionProjectState, shots?: readonly string[]): IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt> {
    productionProjectRefreshRevision(state);
    const selectedShots: Set<string> | null = shots === undefined ? null : new Set(shots);
    const directory: string = path.join(state.productionStateRoot, "renditions");
    const records: IAutoMovieRepaintRecordInspection<IAutoMovieRepaintReceipt>["records"] = [];
    const findings: IAutoMovieRepaintRecordFinding[] = [];
    const unresolvedShot: string = "unresolved";
    const enumerationTarget: { kind: "candidate"; shot: string; recordId: string; } = {
        kind: "candidate" as const,
        shot: unresolvedShot,
        recordId: "renditions",
    };
    const directoryState: Stats | null = lstatOrNull(directory);
    if (directoryState === null)
        return { records, findings };
    if (directoryState.isSymbolicLink())
        return {
            records,
            findings: [
                {
                    target: enumerationTarget,
                    stage: "enumeration",
                    failure: "unsafe-locator",
                    recovery: "Replace linked or escaping state with an owned tracked record.",
                },
            ],
        };
    let entries: Dirent[];
    try {
        entries = fileSystem
            .readdirSync(directory, { withFileTypes: true })
            .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name));
    }
    catch {
        return {
            records,
            findings: [
                {
                    target: enumerationTarget,
                    stage: "enumeration",
                    failure: "unavailable",
                    recovery: "Restore access to the tracked repaint state, then inspect it again.",
                },
            ],
        };
    }
    for (const entry of entries) {
        if (entry.name.endsWith(".json") === false)
            continue;
        let target: { kind: "candidate"; shot: string; recordId: string; } = {
            kind: "candidate" as const,
            shot: unresolvedShot,
            recordId: entry.name.slice(0, -".json".length),
        };
        if (entry.isSymbolicLink() || entry.isFile() === false) {
            findings.push({
                target,
                stage: "receipt",
                failure: "unsafe-locator",
                recovery: "Replace linked or escaping state with an owned tracked record.",
            });
            continue;
        }
        try {
            const receiptPath: string = `renditions/${entry.name}`;
            const bytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, receiptPath);
            if (bytes === null) {
                findings.push({
                    target,
                    stage: "receipt",
                    failure: "absent",
                    recovery: "Create or restore the requested candidate record, then inspect it again.",
                });
                continue;
            }
            let decoded: unknown;
            try {
                decoded = parseAutoMovieStructuredJson({
                    record: "repaint-candidate-receipt",
                    bytes,
                });
            }
            catch {
                findings.push({
                    target,
                    stage: "receipt",
                    failure: "schema-invalid",
                    recovery: "Replace the record with one matching the current schema.",
                });
                continue;
            }
            const validation: typia.IValidation<IAutoMovieRepaintReceipt> = typia.validateEquals<IAutoMovieRepaintReceipt>(decoded);
            if (validation.success === false) {
                findings.push({
                    target,
                    stage: "receipt",
                    failure: "schema-invalid",
                    recovery: "Replace the record with one matching the current schema.",
                });
                continue;
            }
            const receipt: IAutoMovieRepaintReceipt = validation.data;
            if (selectedShots !== null && selectedShots.has(receipt.shot) === false)
                continue;
            target = { ...target, shot: receipt.shot };
            if (receiptPath !== productionRepaintReceiptPath(receipt.output.path)) {
                findings.push({
                    target,
                    stage: "receipt",
                    failure: "identity-invalid",
                    recovery: "Restore the record at its canonical identity.",
                });
                continue;
            }
            let output: Uint8Array;
            try {
                output = productionProjectReadRenderFile(state, receipt.output.path);
            }
            catch (error) {
                const unsafe: boolean = productionProjectSafeProjectErrorMessage(error)
                    .toLowerCase()
                    .includes("link");
                findings.push({
                    target,
                    stage: "output",
                    failure: unsafe ? "unsafe-locator" : "unavailable",
                    recovery: unsafe
                        ? "Replace linked or escaping state with an owned tracked record."
                        : "Restore access to the tracked repaint state, then inspect it again.",
                });
                continue;
            }
            try {
                productionProjectAssertCurrentRepaintReceipt(state, receipt, output);
            }
            catch (error) {
                const classified: { stage: "receipt" | "currentness" | "output"; failure: "identity-invalid" | "stale" | "render-corrupt"; } = productionProjectClassifyCurrentRepaintReceiptError(error);
                findings.push({
                    target,
                    stage: classified.stage,
                    failure: classified.failure,
                    recovery: classified.failure === "stale"
                        ? "Regenerate the record from current production inputs."
                        : classified.failure === "identity-invalid"
                            ? "Restore the record at its canonical identity."
                            : "Restore or regenerate the exact rendition bytes.",
                });
                continue;
            }
            records.push({ target, value: receipt });
        }
        catch {
            findings.push({
                target,
                stage: "receipt",
                failure: "unavailable",
                recovery: "Restore access to the tracked repaint state, then inspect it again.",
            });
        }
    }
    records.sort((left: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }, right: { target: IAutoMovieRepaintRecordTarget; value: IAutoMovieRepaintReceipt; }): number => compareCodeUnits(left.value.shot, right.value.shot) ||
        compareCodeUnits(left.value.completedAt!, right.value.completedAt!) ||
        compareCodeUnits(left.value.attemptId, right.value.attemptId));
    return { records, findings };
}
