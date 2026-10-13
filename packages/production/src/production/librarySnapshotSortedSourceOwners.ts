import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Shallow source-edge copies sort by JSON branch/path/export/target/anchor tuples.
 *
 * @evidence contracts/common.md#principled-implementation Shallow source-edge copies sort by JSON branch/path/export/target/anchor tuples.
 * @evidence contracts/common.md#clear-and-simple-design Snapshot capture canonicalizes selected edge order before identity composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tuple encoding avoids delimiter ambiguity and declared edge fields are scalar; this pass does not deduplicate or freeze copied records.
 * @evidence contracts/common.md#meaningful-documentation States tuple ordering and shallow-copy ownership.
 * @evidence contracts/performance.md#efficient-algorithms E records cost O(E log E) comparisons including repeated tuple encodings, retaining E copied records.
 * @evidence contracts/performance.md#reuse-equivalent-work No tuple/result cache is retained across acquired graph edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The snapshot owns copied scalar-field edge records; additional enumerable values, if supplied outside the declared shape, remain shallow and comparison strings expire.
 */
export const librarySnapshotSortedSourceOwners: (owners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[]) => readonly IAutoMovieProductionEvidenceSourceOwnerBinding[] = (owners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[]): readonly IAutoMovieProductionEvidenceSourceOwnerBinding[] => owners
    .map((owner: IAutoMovieProductionEvidenceSourceOwnerBinding) : IAutoMovieProductionEvidenceSourceOwnerBinding => ({ ...owner }))
    .sort((left: IAutoMovieProductionEvidenceSourceOwnerBinding, right: IAutoMovieProductionEvidenceSourceOwnerBinding) : number => compareCodeUnits(JSON.stringify([
    left.branch,
    left.sourcePath,
    left.exportName,
    left.targetPath,
    left.targetAnchor,
]), JSON.stringify([
    right.branch,
    right.sourcePath,
    right.exportName,
    right.targetPath,
    right.targetAnchor,
])));
