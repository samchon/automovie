import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieSourceRealizationBranch } from "./AutoMovieSourceRealizationBranch";

type AutoMovieEvidenceRevisionBranch = "screenplayNaturalness";

/**
 * Authored layers, independent screenplay naturalness and source families form the complete branch vocabulary.
 *
 * @evidence contracts/common.md#principled-implementation Authored layers, independent screenplay naturalness and source families form the complete branch vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One branch identity joins stage lookup, native bindings and manifest routes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The private revision alias names the existing nested branch and adds no execution surface.
 * @evidence contracts/common.md#meaningful-documentation Naturalness uses its nested stage map while other branches use their direct fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; stageOf and branchClaims join stage values with native claims, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; stageOf and branchClaims join stage values with native claims, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; stageOf and branchClaims join stage values with native claims, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieEvidenceBranch = AutoMovieAuthoredDocumentLayer | AutoMovieEvidenceRevisionBranch | AutoMovieSourceRealizationBranch;
