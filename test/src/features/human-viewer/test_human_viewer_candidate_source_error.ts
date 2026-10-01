import { TestValidator } from "@nestia/e2e";

import { humanViewerCandidateSourceError } from "../../../scripts/human-viewer/humanViewerCandidateSourceError";

/**
 * Candidate recovery reads compiler authority before display errors clear.
 *
 * Scenarios:
 * 1. Legacy resident health reports retain their source error or successful null.
 * 2. An explicit successful compiler overrides an older display error, while
 *    an explicit current compiler error remains authoritative.
 */
export const test_human_viewer_candidate_source_error = (): void => {
  TestValidator.equals("legacy success", humanViewerCandidateSourceError({ sourceError: null }), null);
  TestValidator.equals("legacy error", humanViewerCandidateSourceError({ sourceError: "legacy failure" }), "legacy failure");
  TestValidator.equals("recovery before ready", humanViewerCandidateSourceError({
    sourceError: "old display failure", compilation: { error: null },
  }), null);
  TestValidator.equals("current compiler failure", humanViewerCandidateSourceError({
    sourceError: null, compilation: { error: "new compiler failure" },
  }), "new compiler failure");
};
