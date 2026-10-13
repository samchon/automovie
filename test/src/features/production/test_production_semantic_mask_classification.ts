import {
  IAutoMovieSemanticMask,
} from "@automovie/interface";
import {
  classifyAutoMovieProductionSemanticMaskEvidence,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Absence, historical schema, foreign shot and invalid evidence retain their own classifications.
 *
 * Scenarios:
 * 1. A nonblank not-run observation remains not-run while its blank-reason twin is invalid.
 * 2. Historical mask or envelope is unsupported; malformed coverage, blank shot and tampered digest are invalid, while another shot is foreign.
 */
export const test_production_semantic_mask_classification = (): void => {
  const { validEvidence, withCoverage } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const observation = { status: "available", value: evidence } as const;

  const historicalMask = {
      ...evidence.mask,
      version: 1,
      protocol: "automovie.semantic-mask.v1",
    } as unknown as IAutoMovieSemanticMask;

  const classifications = {
      notRun: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: { status: "not-run", reason: "host lacked mask hook" },
        expectedShot: "opening",
      }),
      blankNotRun: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: { status: "not-run", reason: "  " },
        expectedShot: "opening",
      }),
      unsupported: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: {
          status: "available",
          value: { ...evidence, mask: historicalMask },
        },
        expectedShot: "opening",
      }),
      unsupportedEnvelope: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: {
          status: "available",
          value: { ...evidence, version: 2 } as never,
        },
        expectedShot: "opening",
      }),
      invalidCoverage: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: {
          status: "available",
          value: withCoverage(evidence, {
            unresolved: ["node:z", "node:a"],
            unaddressed: 0,
          }),
        },
        expectedShot: "opening",
      }),
      foreign: classifyAutoMovieProductionSemanticMaskEvidence({
        observation,
        expectedShot: "closing",
      }),
      blankShot: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: {
          status: "available",
          value: { ...evidence, shot: " " },
        },
        expectedShot: "opening",
      }),
      invalid: classifyAutoMovieProductionSemanticMaskEvidence({
        observation: {
          status: "available",
          value: {
            ...evidence,
            mask: { ...evidence.mask, digest: `sha256:${"0".repeat(64)}` },
          },
        },
        expectedShot: "opening",
      }),
    };

  TestValidator.equals(
      "absence and each incompatible evidence class retain their own status",
      Object.fromEntries(
        Object.entries(classifications).map(([name, result]) => [
          name,
          result.status,
        ]),
      ),
      {
        notRun: "not-run",
        blankNotRun: "invalid",
        unsupported: "unsupported",
        unsupportedEnvelope: "unsupported",
        invalidCoverage: "invalid",
        foreign: "foreign",
        blankShot: "invalid",
        invalid: "invalid",
      },
    );
};
