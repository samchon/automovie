import {
  IAutoMovieProductionSemanticMaskEvidence,
  verifyAutoMovieProductionSemanticMaskEvidence,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Semantic evidence refuses malformed record keys and ordered coverage at their actual structural boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real evidence verification on extra/renamed keys, historical version, blank shot and malformed coverage; each requested Error fragment exposes a missing structural, ordering or count gate.
 * @evidence contracts/testing.md#independent-expectations The four-key envelope, two-key coverage, nonblank sorted unique ids and nonnegative safe mesh count define authored refusal inputs; fragment matching checks the named boundary, while the palette's valid digest is constructed by its canonical owner.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all eleven malformed cases, including equal key-count renaming, blank/reversed/repeated ids and negative/fractional/unsafe counts; positive admission, stale receipts and sparse-array behavior are not proved here.
 * @evidence contracts/testing.md#execution-ownership This named discoverable portable unit owns its local malformed table and directly calls the production verifier, without file/capture/native host or dynamic registration.
 *
 * Scenarios:
 * 1. Extra or renamed keys, historical envelope and blank shot retain the original refusal diagnostics.
 * 2. Blank, unsorted or duplicate unresolved IDs and negative, fractional or unsafe mesh counts are refused.
 */
export function test_production_semantic_mask_evidence_admission(): void {
  const { validEvidence, withCoverage, renameKey }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: IAutoMovieProductionSemanticMaskEvidence = validEvidence();

  const malformedEvidence: Array<
      readonly [string, IAutoMovieProductionSemanticMaskEvidence, string]
    > = [
      [
        "extra key",
        { ...evidence, extra: true } as IAutoMovieProductionSemanticMaskEvidence,
        "evidence keys",
      ],
      [
        "same-count wrong key",
        renameKey(evidence, "shot", "take"),
        "evidence keys",
      ],
      ["historical envelope", { ...evidence, version: 2 } as never, "version 2"],
      ["blank shot", { ...evidence, shot: " " }, "non-blank id"],
      [
        "extra coverage key",
        withCoverage(evidence, {
          unresolved: [],
          unaddressed: 0,
          extra: true,
        } as never),
        "coverage keys",
      ],
      [
        "blank unresolved id",
        withCoverage(evidence, { unresolved: [" "], unaddressed: 0 }),
        "sorted unique ids",
      ],
      [
        "unsorted unresolved ids",
        withCoverage(evidence, {
          unresolved: ["node:z", "node:a"],
          unaddressed: 0,
        }),
        "sorted unique ids",
      ],
      [
        "duplicate unresolved ids",
        withCoverage(evidence, {
          unresolved: ["node:a", "node:a"],
          unaddressed: 0,
        }),
        "sorted unique ids",
      ],
      [
        "negative count",
        withCoverage(evidence, { unresolved: [], unaddressed: -1 }),
        "non-negative safe integer",
      ],
      [
        "fractional count",
        withCoverage(evidence, { unresolved: [], unaddressed: 0.5 }),
        "non-negative safe integer",
      ],
      [
        "unsafe count",
        withCoverage(evidence, {
          unresolved: [],
          unaddressed: Number.MAX_SAFE_INTEGER + 1,
        }),
        "non-negative safe integer",
      ],
    ];

  TestValidator.equals(
      "malformed evidence is refused at its exact structural boundary",
      Object.fromEntries(
        malformedEvidence.map(([name, value, message]: readonly [string, IAutoMovieProductionSemanticMaskEvidence, string]): [string, boolean] => [
          name,
          throwsError(
            () =>
              verifyAutoMovieProductionSemanticMaskEvidence({
                evidence: value,
                expectedShot: "opening",
              }),
            message,
          ),
        ]),
      ),
      Object.fromEntries(malformedEvidence.map(([name]: readonly [string, IAutoMovieProductionSemanticMaskEvidence, string]): [string, boolean] => [name, true])),
    );
}
