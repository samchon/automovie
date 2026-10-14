import {
  classifyAutoMovieProductionSemanticMaskEvidence,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Unresolved semantic declarations and unnamed runtime meshes remain distinct incomplete observations.
 *
 * @evidence contracts/testing.md#behavioral-verification Classifies one unresolved semantic id separately from two unaddressed meshes, asserting exact incomplete status/reason/coverage for each; catches loss of either runtime gap dimension or a fabricated complete verdict.
 * @evidence contracts/testing.md#independent-expectations Authored coverage populations determine the literal counts and retained arrays, independently of any captured scene; the canonical fixture supplies coherent palette metadata, not evidence that a real host saw these gaps.
 * @evidence contracts/testing.md#distinguishing-cases Preserves unresolved-only and unaddressed-only observations; zero-gap completion, simultaneous gaps, malformed coverage, historical versions and resident receipt correspondence belong to neighboring semantic tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit directly invokes classification on memory records and owns both variants without a renderer, capture/browser, filesystem read or dynamic registrations.
 *
 * Scenarios:
 * 1. One unresolved ID with no unnamed meshes preserves its exact incomplete reason and coverage.
 * 2. Two unnamed meshes with no unresolved IDs preserve their separate incomplete reason and coverage.
 */
export function test_production_semantic_mask_runtime_gaps(): void {
  const { validEvidence, withCoverage }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const unresolved: ReturnType<typeof validEvidence> = withCoverage(evidence, {
      unresolved: ["node:missing"],
      unaddressed: 0,
    });

  const unnamed: ReturnType<typeof validEvidence> = withCoverage(evidence, {
      unresolved: [],
      unaddressed: 2,
    });

  TestValidator.equals(
      "the two runtime gap directions remain separate incomplete facts",
      [unresolved, unnamed].map((value: ReturnType<typeof validEvidence>): { status: string; reason: string | null; coverage: ReturnType<typeof validEvidence>["coverage"] | null } => {
        const result: ReturnType<typeof classifyAutoMovieProductionSemanticMaskEvidence> = classifyAutoMovieProductionSemanticMaskEvidence({
          observation: { status: "available", value },
          expectedShot: "opening",
        });
        return {
          status: result.status,
          reason: "reason" in result ? result.reason : null,
          coverage: "evidence" in result ? result.evidence.coverage : null,
        };
      }),
      [
        {
          status: "incomplete",
          reason:
            'semantic mask for shot "opening" has 1 unresolved ids and 0 unaddressed meshes',
          coverage: { unresolved: ["node:missing"], unaddressed: 0 },
        },
        {
          status: "incomplete",
          reason:
            'semantic mask for shot "opening" has 0 unresolved ids and 2 unaddressed meshes',
          coverage: { unresolved: [], unaddressed: 2 },
        },
      ],
    );
}
