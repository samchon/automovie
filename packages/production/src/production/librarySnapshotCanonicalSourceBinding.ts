import type { IAutoMovieProductionEvidenceSourceBinding } from "@automovie/evidence";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Non-null shallow copies sort files/symbols and enforced paths; unenforced paths become empty.
 *
 * @evidence contracts/common.md#principled-implementation Non-null shallow copies sort files/symbols and enforced paths; unenforced paths become empty.
 * @evidence contracts/common.md#clear-and-simple-design Branch and owner snapshots share one canonical binding representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inactive discoveries are excluded by enforcement while other fields remain; no new graph-policy decision is inferred.
 * @evidence contracts/common.md#meaningful-documentation States null preservation, copied arrays and shallow remaining fields.
 * @evidence contracts/performance.md#efficient-algorithms Copies and sorts F file/P active path/S symbol references with comparison text costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Both populations share this owner, but repeated equal bindings are rebuilt rather than memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The snapshot owns the record and every declared array field; additional enumerable values outside the shape remain shallow and no handle is acquired.
 */
export const librarySnapshotCanonicalSourceBinding: (binding: IAutoMovieProductionEvidenceSourceBinding | null) => IAutoMovieProductionEvidenceSourceBinding | null = (binding: IAutoMovieProductionEvidenceSourceBinding | null): IAutoMovieProductionEvidenceSourceBinding | null => binding === null
    ? null
    : {
        ...binding,
        files: [...binding.files].sort(compareCodeUnits),
        paths: binding.enforced
            ? [...binding.paths].sort(compareCodeUnits)
            : [],
        symbols: [...binding.symbols].sort(compareCodeUnits),
    };
