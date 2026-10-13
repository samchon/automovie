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
 * Scenarios:
 * 1. One unresolved ID with no unnamed meshes preserves its exact incomplete reason and coverage.
 * 2. Two unnamed meshes with no unresolved IDs preserve their separate incomplete reason and coverage.
 */
export const test_production_semantic_mask_runtime_gaps = (): void => {
  const { validEvidence, withCoverage } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const unresolved = withCoverage(evidence, {
      unresolved: ["node:missing"],
      unaddressed: 0,
    });

  const unnamed = withCoverage(evidence, {
      unresolved: [],
      unaddressed: 2,
    });

  TestValidator.equals(
      "the two runtime gap directions remain separate incomplete facts",
      [unresolved, unnamed].map((value) => {
        const result = classifyAutoMovieProductionSemanticMaskEvidence({
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
};
