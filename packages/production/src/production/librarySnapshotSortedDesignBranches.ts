import type { IAutoMovieProductionEvidenceDesignBranch } from "@automovie/evidence";
import { compareCodeUnits } from "./contentIdentity";
import { librarySnapshotCanonicalSourceBinding } from "./librarySnapshotCanonicalSourceBinding";

/**
 * Copied branch records and canonical source bindings sort by exact branch code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation Copied branch records and canonical source bindings sort by exact branch code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design Snapshot capture owns population ordering independent of discovery order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sorting does not prove branch uniqueness; evidence admission owns population validity.
 * @evidence contracts/common.md#meaningful-documentation States shallow outer copies, copied binding arrays and absence of freezing.
 * @evidence contracts/performance.md#efficient-algorithms B branches cost O(B log B) comparisons plus all binding copies/sorts.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared binding canonicalizer without a graph-edit-blind cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied records and declared binding arrays transfer to the snapshot; extra enumerable values outside the declared shape remain shallow and no handle is acquired.
 */
export const librarySnapshotSortedDesignBranches: (branches: readonly IAutoMovieProductionEvidenceDesignBranch[]) => readonly IAutoMovieProductionEvidenceDesignBranch[] = (branches: readonly IAutoMovieProductionEvidenceDesignBranch[]): readonly IAutoMovieProductionEvidenceDesignBranch[] => [...branches]
    .map((branch: IAutoMovieProductionEvidenceDesignBranch) : IAutoMovieProductionEvidenceDesignBranch => ({
    ...branch,
    sourceBinding: librarySnapshotCanonicalSourceBinding(branch.sourceBinding),
}))
    .sort((left: IAutoMovieProductionEvidenceDesignBranch, right: IAutoMovieProductionEvidenceDesignBranch) : number => compareCodeUnits(left.branch, right.branch));
