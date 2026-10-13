import type { IAutoMovieProductionEvidenceSourceBinding } from "@automovie/evidence";

/**
 * Only a non-null enforced binding exposes selected paths; inactive bindings yield an empty list.
 *
 * @evidence contracts/common.md#principled-implementation Only a non-null enforced binding exposes selected paths; inactive bindings yield an empty list.
 * @evidence contracts/common.md#clear-and-simple-design Source selection follows explicit graph enforcement before acquiring bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Present source files or stage spelling cannot activate an unenforced edge here.
 * @evidence contracts/common.md#meaningful-documentation States borrowed active paths and fresh empty output for inactive bindings.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar checks do not traverse active arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing admitted list is borrowed before caller deduplication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller keeps the borrowed list as needed; this function retains no binding.
 */
export const librarySnapshotActivePaths: (binding: IAutoMovieProductionEvidenceSourceBinding | null) => readonly string[] = (binding: IAutoMovieProductionEvidenceSourceBinding | null): readonly string[] => binding !== null && binding.enforced ? binding.paths : [];
