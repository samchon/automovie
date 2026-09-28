import type { AutoMovieEvidenceStage } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const policy = loadSourceModule<{
  requiresAutoMovieEvidenceReview: (stage: AutoMovieEvidenceStage) => boolean;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/evidence/src/productionEvidenceReviewPolicy.ts",
  ),
);

/**
 * Completion declarations never create a native companion-writing duty.
 *
 * Scenarios:
 * 1. Disabled, draft, evidence and compatible review all refuse to require
 *    evidenceReview rows; actual physical inspection remains a separate gate.
 */
export const test_evidence_review_policy = (): void => {
  TestValidator.equals(
    "no lifecycle state requires companion rows",
    (["disabled", "draft", "evidence", "review"] as const).map(
      policy.requiresAutoMovieEvidenceReview,
    ),
    [false, false, false, false],
  );
};
