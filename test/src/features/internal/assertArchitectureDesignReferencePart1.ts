import type {
  IAutoMovieConstraintViolation,
  IAutoMovieDesignEvidence,
  IAutoMovieDesignReference,
  IAutoMovieGeneratedAcquisition,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateDesignEvidence } from "@automovie/engine";
import { validateDesignReference } from "@automovie/engine";
import { validateGeneratedAcquisition } from "@automovie/engine";
import {
  hasViolation,
  namedFacts,
  validationHasWarning,
  validationHasWarningCount,
  violationCount,
} from "./predicates";

/** Execute the next ordered assertions of test_architecture_design_reference.
 *
 * Scenarios:
 * 1. an observed pavilion sheet validates as evidence.
 * 2. a generated study with no source URL and no seed is complete provenance.
 * 3. a text-only generation with no prompt text and no request id is accepted.
 * 4. a reproducible claim with no seed is refused.
 * 5. a reproducible claim carrying its seed is accepted.
 * 6. a seed on an irreproducible generation warns instead of failing.
 * 7. a negative provider seed is a whole number and is accepted.
 * 8. a generated output digest that is not the current bytes is refused.
 * 9. processed bytes skip the output-digest comparison rather than fail it.
 * 10. citations that resolve, including one deliberately citing both readings.
 * 11. an empty citation ledger is a clean success rather than a silent gap.
 * 12. two documents sharing one id pool their candidates for citation.
 *
 * Authored reference/provenance fields define version/media/digest spelling, required reproduction-seed metadata and safe-integer seed admission. Matching/mismatching supplied output-digest strings and citation identities determine the located results; no provider execution, asset-byte read or replay is an independent expectation here.
 * Observed/generated provenance, omitted optional prompt/request, reproducible missing/present seed, irreproducible seed warning, negative and malformed seeds, digest mismatch/null-after-processing, individual malformed acquisition fields and citation resolution/empty ledger retain their distinct outcomes. Parts2/3 own malformed reference mutations.
 */
export function assertArchitectureDesignReferencePart1(
  PLAN_DIGEST: string,
  STUDY_DIGEST: string,
  observation: () => IAutoMovieDesignReference,
  generated: () => IAutoMovieGeneratedAcquisition,
  evidence: () => IAutoMovieDesignEvidence[],
): void {
  const source: IAutoMovieDesignReference = observation();
  TestValidator.equals(
    "an observed pavilion sheet validates as evidence",
    validateDesignReference({ reference: source }).success,
    true,
  );

  // 5-8. The generated acquisition ledger.
  TestValidator.equals(
    "a generated study with no source URL and no seed is complete provenance",
    validateGeneratedAcquisition({
      acquisition: generated(),
      digest: STUDY_DIGEST,
    }).success,
    true,
  );
  TestValidator.equals(
    "a text-only generation with no prompt text and no request id is accepted",
    validateGeneratedAcquisition({
      acquisition: {
        ...generated(),
        request: null,
        prompt: null,
        inputs: [],
      },
      digest: STUDY_DIGEST,
    }).success,
    true,
  );
  TestValidator.predicate(
    "a reproducible claim with no seed is refused",
    hasViolation(
      validateGeneratedAcquisition({
        acquisition: { ...generated(), reproducible: true },
        digest: STUDY_DIGEST,
      }),
      "type",
      "$input.seed",
    ),
  );
  TestValidator.equals(
    "a reproducible claim carrying its seed is accepted",
    validateGeneratedAcquisition({
      acquisition: { ...generated(), reproducible: true, seed: 4211 },
      digest: STUDY_DIGEST,
    }).success,
    true,
  );
  const decorated: IAutoMovieValidation = validateGeneratedAcquisition({
    acquisition: { ...generated(), seed: 4211 },
    digest: STUDY_DIGEST,
  });
  TestValidator.equals(
    "a seed on an irreproducible generation warns instead of failing",
    namedFacts([
      [
        "warned",
        (): boolean =>
          validationHasWarning(
            "irreproducible generation carrying a seed",
            decorated,
            "type",
            "$input.seed",
          ),
      ],
      [
        "onlyWarning",
        (): boolean =>
          validationHasWarningCount(
            "irreproducible generation carrying a seed",
            decorated,
            1,
          ),
      ],
    ]),
    { warned: true, onlyWarning: true },
  );
  const seedRefusals: ReadonlyArray<readonly [string, number]> = [
    ["a fractional seed", 4211.5],
    ["an infinite seed", Number.POSITIVE_INFINITY],
    ["a NaN seed", Number.NaN],
    ["a seed beyond exact integer range", 2 ** 53],
  ];
  seedRefusals.forEach(([name, seed]: readonly [string, number]): void => {
    TestValidator.predicate(
      `${name} is refused rather than accepted as a replay handle`,
      hasViolation(
        validateGeneratedAcquisition({
          acquisition: { ...generated(), reproducible: true, seed },
          digest: STUDY_DIGEST,
        }),
        "range",
        "$input.seed",
      ),
    );
    const irreproducible: IAutoMovieValidation = validateGeneratedAcquisition({
      acquisition: { ...generated(), seed },
      digest: STUDY_DIGEST,
    });
    TestValidator.equals(
      `${name} on an irreproducible generation fails outright rather than warning`,
      namedFacts([
        [
          "refused",
          (): boolean => hasViolation(irreproducible, "range", "$input.seed"),
        ],
        ["onlyViolation", (): boolean => violationCount(irreproducible) === 1],
      ]),
      { refused: true, onlyViolation: true },
    );
  });
  TestValidator.equals(
    "a negative provider seed is a whole number and is accepted",
    validateGeneratedAcquisition({
      acquisition: { ...generated(), reproducible: true, seed: -1 },
      digest: STUDY_DIGEST,
    }).success,
    true,
  );

  TestValidator.predicate(
    "a generated output digest that is not the current bytes is refused",
    hasViolation(
      validateGeneratedAcquisition({
        acquisition: generated(),
        digest: PLAN_DIGEST,
      }),
      "type",
      "$input.outputDigest",
    ),
  );
  TestValidator.equals(
    "processed bytes skip the output-digest comparison rather than fail it",
    validateGeneratedAcquisition({
      acquisition: generated(),
      digest: null,
    }).success,
    true,
  );
  const acquisitionRefusals: ReadonlyArray<
    readonly [string, (value: IAutoMovieGeneratedAcquisition) => void, string]
  > = [
    [
      "blank provider",
      (value: IAutoMovieGeneratedAcquisition): string =>
        (value.provider = "  "),
      "$input.provider",
    ],
    [
      "blank model",
      (value: IAutoMovieGeneratedAcquisition): string => (value.model = ""),
      "$input.model",
    ],
    [
      "blank request id",
      (value: IAutoMovieGeneratedAcquisition): string => (value.request = " "),
      "$input.request",
    ],
    [
      "blank prompt",
      (value: IAutoMovieGeneratedAcquisition): string => (value.prompt = " "),
      "$input.prompt",
    ],
    [
      "malformed prompt digest",
      (value: IAutoMovieGeneratedAcquisition): string =>
        (value.promptDigest = "sha256:zz" as string),
      "$input.promptDigest",
    ],
    [
      "malformed output digest",
      (value: IAutoMovieGeneratedAcquisition): string =>
        (value.outputDigest = "md5:abc" as string),
      "$input.outputDigest",
    ],
    [
      "blank input path",
      (value: IAutoMovieGeneratedAcquisition): string => (value.inputs[0] = ""),
      "$input.inputs[0]",
    ],
    [
      "missing resident input path",
      (value: IAutoMovieGeneratedAcquisition): string[] =>
        (value.inputs = new Array<string>(1)),
      "$input.inputs[0]",
    ],
  ];
  acquisitionRefusals.forEach(
    ([name, mutate, path]: readonly [
      string,
      (value: IAutoMovieGeneratedAcquisition) => void,
      string,
    ]): void => {
      const value: IAutoMovieGeneratedAcquisition = generated();
      mutate(value);
      TestValidator.predicate(
        `${name} is refused at ${path}`,
        hasViolation(
          validateGeneratedAcquisition({ acquisition: value, digest: null }),
          "type",
          path,
        ),
      );
    },
  );

  // 9. Citations.
  TestValidator.equals(
    "citations that resolve, including one deliberately citing both readings",
    validateDesignEvidence({
      references: [source],
      evidence: evidence(),
    }).success,
    true,
  );
  TestValidator.equals(
    "an empty citation ledger is a clean success rather than a silent gap",
    validateDesignEvidence({ references: [source], evidence: [] }).success,
    true,
  );
  const evidenceRefusals: ReadonlyArray<
    readonly [string, (value: IAutoMovieDesignEvidence[]) => void, string]
  > = [
    [
      "blank subject",
      (value: IAutoMovieDesignEvidence[]): string => (value[0]!.subject = " "),
      "$input.evidence[0].subject",
    ],
    [
      "blank rationale",
      (value: IAutoMovieDesignEvidence[]): string => (value[0]!.rationale = ""),
      "$input.evidence[0].rationale",
    ],
    [
      "dangling document",
      (value: IAutoMovieDesignEvidence[]): string =>
        (value[0]!.document = "ghost-sheet"),
      "$input.evidence[0].document",
    ],
    [
      "no cited candidate",
      (value: IAutoMovieDesignEvidence[]): never[] =>
        (value[0]!.candidates = []),
      "$input.evidence[0].candidates",
    ],
    [
      "dangling candidate",
      (value: IAutoMovieDesignEvidence[]): string =>
        (value[0]!.candidates[0] = "wall-ghost"),
      "$input.evidence[0].candidates[0]",
    ],
    [
      "repeated candidate for one subject",
      (value: IAutoMovieDesignEvidence[]): number =>
        value[1]!.candidates.push("wall-north-outer"),
      "$input.evidence[1].candidates[2]",
    ],
  ];
  evidenceRefusals.forEach(
    ([name, mutate, path]: readonly [
      string,
      (value: IAutoMovieDesignEvidence[]) => void,
      string,
    ]): void => {
      const value: IAutoMovieDesignEvidence[] = evidence();
      mutate(value);
      const validation: IAutoMovieValidation = validateDesignEvidence({
        references: [source],
        evidence: value,
      });
      TestValidator.equals(
        `${name} evidence is refused at ${path}`,
        namedFacts([
          ["refused", (): boolean => validation.success === false],
          [
            "atPath",
            (): boolean =>
              // The `success` comparison is restated only to narrow the union
              // inside this closure.
              validation.success === false &&
              validation.violations.some(
                (violation: IAutoMovieConstraintViolation): boolean =>
                  violation.path === path,
              ),
          ],
        ]),
        { refused: true, atPath: true },
      );
    },
  );
  TestValidator.equals(
    "two documents sharing one id pool their candidates for citation",
    validateDesignEvidence({
      references: [
        { ...source, candidates: [source.candidates[0]!] },
        { ...source, candidates: [source.candidates[2]!] },
      ],
      evidence: [evidence()[0]!],
    }).success,
    true,
  );
}
