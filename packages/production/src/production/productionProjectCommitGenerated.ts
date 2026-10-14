import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { IAutoMovieGeneratedManifest } from "@automovie/interface";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { planAutoMovieGeneratedPublication } from "./planAutoMovieGeneratedPublication";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectGeneratedManifest } from "./productionProjectGeneratedManifest";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectReadGeneratedFile } from "./productionProjectReadGeneratedFile";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";
import { productionProjectAssertGeneratedOutputCurrent } from "./productionProjectAssertGeneratedOutputCurrent";

/**
 * Publish one complete generated candidate with guarded byte comparison and revision accounting.
 *
 * @evidence contracts/common.md#principled-implementation A lazy planner runs under commit locks, retires previous members, compares copied candidate bytes and writes the manifest last; output verification runs before revision publication.
 * @evidence contracts/common.md#clear-and-simple-design The planner owns changed-write selection, commitFiles owns mutation/rollback, and outputCurrent owns exact resident inventory and bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identical writes preserve the current revision; unsafe read errors propagate rather than becoming missing-file repairs. Callers must supply the manifest/currentness guard for the same candidate.
 * @evidence contracts/common.md#meaningful-documentation Returns the transaction revision; verification or input races can refuse and rollback, while post-revision failure may report already committed data.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete candidate/resident byte reads and copies, manifest serialization, retirement scans, staged previous bytes, atomic writes and full inventory/payload verification, even for a byte-identical no-op.
 * @evidence contracts/performance.md#reuse-equivalent-work Byte-identical members avoid writes after fresh observation; previous bytes remain available for rollback, and currentness callbacks are rerun rather than memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources CommitFiles and atomic owners attempt namespace/lock/temporary cleanup; refusal can retain fences or bytes, and incomplete rollback or postcommit failure is reported by mutation accounting. Candidate, resident and rollback buffers live for the attempt without a fixed byte cap; success returns only the revision.
 */
export function productionProjectCommitGenerated(state: AutoMovieProductionProjectState, files: ReadonlyMap<string, Uint8Array>, manifest: IAutoMovieGeneratedManifest, inputCurrent?: () => boolean, expectedRevision: number = state.lastReadRevision_): number {
    const serializedManifest: string = productionProjectSerializeJson(manifest);
    return productionProjectCommitFiles(state, (): { path: string; content: Uint8Array | string | null; }[] => planAutoMovieGeneratedPublication({
        previous: productionProjectGeneratedManifest(state),
        files,
        serializedManifest,
        resolveMember: (relative: string): string => resolveInside(productionProjectGeneratedRoot(state), relative),
        exists: (absolute: string): boolean => fileSystem.existsSync(absolute),
        readMember: (relative: string): Uint8Array<ArrayBufferLike> => productionProjectReadGeneratedFile(state, relative),
        manifestPath: path.join(state.productionStateRoot, "generated-manifest.json"),
        readManifest: (): Uint8Array<ArrayBufferLike> | null => productionProjectReadTrackedStateFile(state, "generated-manifest.json"),
    }), inputCurrent, expectedRevision, (): void => productionProjectAssertGeneratedOutputCurrent(state, files, serializedManifest), false);
}
