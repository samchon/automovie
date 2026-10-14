import type { Dirent } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import type { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRepaintAttemptPath } from "./productionProjectRepaintAttemptPath";
import { productionProjectUuid } from "./productionProjectUuid";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectAssertRepaintAttempt } from "./productionProjectAssertRepaintAttempt";

/**
 * Read the complete canonical terminal-attempt population for one immutable request in ordinal order.
 *
 * @evidence contracts/common.md#principled-implementation The request UUID fences discovery; linked directories and nonregular JSON residents refuse, each guarded duplicate-aware record passes attempt admission and canonical filename agreement, and sorted records must form a contiguous chronological retryable lineage.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns whole-request population and predecessor coherence; individual metadata validation and execution-policy aggregation remain with their dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed siblings are not omitted to produce a valid prefix; gaps, divergent immutable identity or an ineligible predecessor throw, while initial directory absence alone yields an empty ledger.
 * @evidence contracts/common.md#meaningful-documentation Defines discovery, filename and ordinal sorting, missing-directory behavior and complete-lineage refusal; it does not by itself prove every attempt's output bytes or immutable policy compliance.
 * @evidence contracts/performance.md#efficient-algorithms E directory entries are filtered and A JSON records sorted by filename then ordinal in O(E + A log A) comparisons plus text costs; each record incurs guarded parsing/identity validation and namespace observations, followed by one chronological pass.
 * @evidence contracts/performance.md#reuse-equivalent-work The complete admitted array supplies both ordered return and predecessor checks; directory membership and resident bytes are refreshed instead of caching a request prefix.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Discovery arrays, decoded records and ordinal ordering scale with resident population; guarded readers close descriptors and the complete record array transfers to the caller without retaining per-record byte buffers or timers.
 */
export function productionProjectRepaintRequestAttempts(state: AutoMovieProductionProjectState, requestId: string): IAutoMovieRepaintAttemptRecord[] {
    const request: string = productionProjectUuid(requestId, "Repaint request id");
    const directory: string = path.join(state.productionStateRoot, "renditions", "attempts", request);
    if (lstatOrNull(directory) === null)
        return [];
    if (fileSystem.lstatSync(directory).isSymbolicLink())
        throw new Error("Repaint attempt directory must not be a link.");
    const attempts: IAutoMovieRepaintAttemptRecord[] = fileSystem
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry: Dirent<string>): boolean => entry.name.endsWith(".json"))
        .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name))
        .map((entry: Dirent<string>): IAutoMovieRepaintAttemptRecord => {
        if (entry.isFile() === false)
            throw new Error(`Repaint attempt resident "${entry.name}" must be a regular JSON file.`);
        const relative: string = `renditions/attempts/${request}/${entry.name}`;
        let decoded: IAutoMovieRepaintAttemptRecord;
        try {
            const bytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, relative);
            if (bytes === null)
                throw new Error("the resident disappeared while being read");
            decoded = parseAutoMovieStructuredJson({
                record: "repaint-attempt",
                bytes,
            }) as IAutoMovieRepaintAttemptRecord;
            productionProjectAssertRepaintAttempt(state, decoded);
        }
        catch (error) {
            throw new Error(`Repaint attempt resident "${entry.name}" is malformed: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (decoded.requestId !== request ||
            relative !== productionProjectRepaintAttemptPath(decoded.requestId, decoded.attemptId))
            throw new Error(`Repaint attempt resident "${entry.name}" does not match its canonical request and attempt identity.`);
        return decoded;
    })
        .sort((left: IAutoMovieRepaintAttemptRecord, right: IAutoMovieRepaintAttemptRecord): number => left.ordinal - right.ordinal ||
        compareCodeUnits(left.attemptId, right.attemptId));
    for (const [index, attempt] of attempts.entries()) {
        const previous: IAutoMovieRepaintAttemptRecord | undefined = attempts[index - 1];
        if (attempt.ordinal !== index + 1 ||
            (previous !== undefined &&
                (previous.status !== "failed" ||
                    previous.failure?.retryable !== true ||
                    attempt.shot !== previous.shot ||
                    attempt.requestFingerprint !== previous.requestFingerprint ||
                    attempt.compileFingerprint !== previous.compileFingerprint ||
                    attempt.sourceRenderFingerprint !==
                        previous.sourceRenderFingerprint ||
                    attempt.adapterIdentity !== previous.adapterIdentity ||
                    attempt.seed !== previous.seed ||
                    new Date(attempt.startedAt).getTime() <
                        new Date(previous.completedAt).getTime())))
            throw new Error(`Repaint request "${request}" requires contiguous chronological attempts whose preceding terminal state remained retryable under one immutable request identity.`);
    }
    return attempts;
}
