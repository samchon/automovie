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
 * @evidence contracts/testing.md#behavioral-verification Calls the real semantic-evidence classifier with not-run, historical mask/envelope, malformed coverage, foreign/blank shot and altered digest observations; the explicit status map exposes collapsed unsupported/foreign/invalid/not-run branches.
 * @evidence contracts/testing.md#independent-expectations Authored protocol versions, expected shot and supported coverage ordering define each status; the fixture seals a valid palette through the engine digest owner, so this is classification admission rather than an independent palette-hash or pixel oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves nonblank versus blank absence reasons, historical mask and envelope independently, reversed unresolved ids, foreign versus blank shot and digest tampering; complete/incomplete runtime gaps and receipt bytes are owned by the neighboring semantic tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit owns all eight variants and calls production semantics on in-memory evidence; no capture browser, renderer, filesystem reader or dynamic case registration runs.
 *
 * Scenarios:
 * 1. A nonblank not-run observation remains not-run while its blank-reason twin is invalid.
 * 2. Historical mask or envelope is unsupported; malformed coverage, blank shot and tampered digest are invalid, while another shot is foreign.
 */
export function test_production_semantic_mask_classification(): void {
  const { validEvidence, withCoverage }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const observation: Parameters<typeof classifyAutoMovieProductionSemanticMaskEvidence>[0]["observation"] = { status: "available", value: evidence } as const;

  const historicalMask: IAutoMovieSemanticMask = {
      ...evidence.mask,
      version: 1,
      protocol: "automovie.semantic-mask.v1",
    } as unknown as IAutoMovieSemanticMask;

  const classifications: Record<string, ReturnType<typeof classifyAutoMovieProductionSemanticMaskEvidence>> = {
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
        Object.entries(classifications).map(([name, result]: [string, ReturnType<typeof classifyAutoMovieProductionSemanticMaskEvidence>]): [string, string] => [
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
}
