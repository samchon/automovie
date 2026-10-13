import type { IAutoMovieProductionEvidenceDesignOwner } from "@automovie/evidence";
import { compareCodeUnits } from "./contentIdentity";
import { librarySnapshotCanonicalSourceBinding } from "./librarySnapshotCanonicalSourceBinding";

/**
 * Copied owners/units and canonical bindings sort by branch/NUL/path identity, preserving existing unit order.
 *
 * @evidence contracts/common.md#principled-implementation Copied owners/units and canonical bindings sort by branch/NUL/path identity, preserving existing unit order.
 * @evidence contracts/common.md#clear-and-simple-design Snapshot capture canonicalizes owner population without inventing unit ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sorting neither proves owner uniqueness nor validates unit order; the admitted evidence graph owns those premises.
 * @evidence contracts/common.md#meaningful-documentation States shallow unit copies, preserved unit order and remaining nested references.
 * @evidence contracts/performance.md#efficient-algorithms Visits O owners/U units, sorts O owners and includes all binding-array sorting costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares binding canonicalization and comparator instead of retaining old graph results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The snapshot owns outer records, copied unit records and declared binding arrays; extra enumerable values outside the shape remain shallow.
 */
export const librarySnapshotSortedDesignOwners: (owners: readonly IAutoMovieProductionEvidenceDesignOwner[]) => readonly IAutoMovieProductionEvidenceDesignOwner[] = (owners: readonly IAutoMovieProductionEvidenceDesignOwner[]): readonly IAutoMovieProductionEvidenceDesignOwner[] => [...owners]
    .map((owner: IAutoMovieProductionEvidenceDesignOwner) : IAutoMovieProductionEvidenceDesignOwner => ({
    ...owner,
    units: owner.units.map((unit: IAutoMovieProductionEvidenceDesignOwner["units"][number]) : IAutoMovieProductionEvidenceDesignOwner["units"][number] => ({ ...unit })),
    sourceBinding: librarySnapshotCanonicalSourceBinding(owner.sourceBinding),
}))
    .sort((left: IAutoMovieProductionEvidenceDesignOwner, right: IAutoMovieProductionEvidenceDesignOwner) : number => compareCodeUnits(`${left.branch}\0${left.path}`, `${right.branch}\0${right.path}`));
