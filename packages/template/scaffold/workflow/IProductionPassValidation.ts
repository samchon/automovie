import type {
  IEvidenceCheckAnalysis,
  IEvidenceDiagnostic,
} from "@wrtnlabs/evidence";

import type { IProductionPassValidationScope } from "./IProductionPassValidationScope";

/** Structural evidence only; independent readers issue creative verdicts. */
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
  /** Current authored structure and all prerequisites permit a full reread. */
  rereadReady: boolean;
  /** Includes active, nonempty current review and verdict and all their findings. */
  approvalStructureReady: boolean;
  /** Current pass review or whole-population verdict populations still absent. */
  missingReviewClaims: ("review" | "verdict")[];
  /** Reviewed working text not yet present verbatim, without comments, in body. */
  pendingNaturalnessTransfers: {
    layer: "scripts" | "screenplay";
    file: string;
    reason: string;
  }[];
}
