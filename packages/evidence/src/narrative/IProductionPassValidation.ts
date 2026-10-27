import type {
  IEvidenceCheckAnalysis,
  IEvidenceDiagnostic,
} from "@wrtnlabs/evidence";

import type { IProductionPassValidationScope } from "./IProductionPassValidationScope";

/**
 * Structural evidence only; independent readers issue creative verdicts.
 *
 * @evidence contracts/common.md#principled-implementation The result separates the unchanged native analysis and package verdict from scoped readiness, review refreshes and unpromoted working text; no boolean grants creative approval.
 * @evidence contracts/common.md#clear-and-simple-design Native package success, blocking findings, reread refresh and unpromoted bytes stay separate so structural readiness cannot replace creative verdicts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original diagnostics and pending transfers are exposed; no result field hides required evidence or mutates native success.
 * @evidence contracts/common.md#meaningful-documentation Members state original analysis ownership, readiness boundaries, absent review claims and exact-byte promotion duties.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Scoped validation result is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scoped validation result declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scoped validation result acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionPassValidation {
  /** The exact complete analysis returned by the public evidence API. */
  analysis: IEvidenceCheckAnalysis;

  /** Unmodified success of the entire active package graph. */
  packageSuccess: boolean;

  /** Captured pass ownership, prerequisites, and input boundaries. */
  scope: IProductionPassValidationScope;

  /** Findings that prevent this pass from being submitted for a reread. */
  blockingDiagnostics: IEvidenceDiagnostic[];

  /** Current review findings requiring a fresh reading of changed units. */
  reviewRefreshDiagnostics: IEvidenceDiagnostic[];

  /** Known policy findings belonging exclusively to downstream passes. */
  frozenDownstreamDiagnostics: IEvidenceDiagnostic[];

  /** Authored structure and prerequisites permit reading, even with empty current reviews. */
  rereadReady: boolean;

  /** Includes active, nonempty current review and verdict and all their findings. */
  approvalStructureReady: boolean;

  /** Current pass review or whole-population verdict populations still absent. */
  missingReviewClaims: ("review" | "verdict")[];

  /** Reviewed working text not yet present verbatim, without comments, in body. */
  pendingNaturalnessTransfers: {
    /** Expression layer whose supplied working text still needs promotion. */
    layer: "scripts" | "screenplay";

    /** Manuscript-relative path shared by working and body counterparts. */
    file: string;

    /** Captured identity or byte difference preventing promotion readiness. */
    reason: string;
  }[];
}
