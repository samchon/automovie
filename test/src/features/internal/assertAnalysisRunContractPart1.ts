import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { autoMovieAnalysisRunDigest, isAutoMovieAnalysisDomain, sealAutoMovieAnalysisRun, validateAutoMovieAnalysisRun } from "@automovie/engine";



import { sealedAnalysisRun } from "./analysisFixtures";
import { hasViolation, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. a sealed run validates, re-seals identically, and refuses every edit.
 * 2. moving a separator across a field boundary changes the run digest.
 *
 * A run sealed through the public builder must validate and reseal identically; independently editing covered fields while retaining its seal must refuse it. Moving newline or pipe characters between named fields must not collapse the canonical field boundaries. Recomputing fixture seals isolates contents rules and is not an independent SHA-256 oracle.
 * Working seal, reseal, changed digest/contents, unknown domain and separator-relocation pairs distinguish integrity from structural admission. Later parts own detailed identity, metric, sample, warning and summary rules.
 */
export function assertAnalysisRunContractPart1(): {
  digest: (fill: string) => `sha256:${string}`;
  measured: (
    overrides?: Partial<IAutoMovieAnalysisMetric>,
  ) => IAutoMovieAnalysisMetric;
  draft: (
    overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
  ) => Omit<IAutoMovieAnalysisRun, "digest">;
  check: (
    overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
  ) => IAutoMovieValidation;
  solved: (
    metrics: IAutoMovieAnalysisMetric[],
    samples?: IAutoMovieAnalysisSample[],
    warnings?: IAutoMovieAnalysisWarning[],
  ) => IAutoMovieValidation;
} {
  const digest: (fill: string) => `sha256:${string}` = (
    fill: string,
  ): `sha256:${string}` => `sha256:${fill.repeat(64)}`;
  const measured: (
    overrides?: Partial<IAutoMovieAnalysisMetric>,
  ) => IAutoMovieAnalysisMetric = (
    overrides: Partial<IAutoMovieAnalysisMetric> = {},
  ): IAutoMovieAnalysisMetric => ({
    key: "room.reverberationTime",
    unit: "s",
    value: 0.8,
    target: null,
    comparison: null,
    status: "untargeted",
    gap: null,
    ...overrides,
  });
  const draft: (
    overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
  ) => Omit<IAutoMovieAnalysisRun, "digest"> = (
    overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">> = {},
  ): Omit<IAutoMovieAnalysisRun, "digest"> => ({
    version: 1,
    protocol: "automovie.analysis-run.v1",
    id: "hall-acoustics",
    domain: "acoustic",
    subject: "space:hall",
    inputRevision: "r7",
    solver: { id: "solver", version: "1", model: "Sabine" },
    settings: digest("1"),
    outcome: {
      status: "solved",
      metrics: [measured()],
      samples: [],
      warnings: [],
    },
    ...overrides,
  });
  const check: (
    overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
  ) => IAutoMovieValidation = (
    overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">> = {},
  ): IAutoMovieValidation =>
    validateAutoMovieAnalysisRun({ run: sealedAnalysisRun(draft(overrides)) });
  const solved: (
    metrics: IAutoMovieAnalysisMetric[],
    samples?: IAutoMovieAnalysisSample[],
    warnings?: IAutoMovieAnalysisWarning[],
  ) => IAutoMovieValidation = (
    metrics: IAutoMovieAnalysisMetric[],
    samples: IAutoMovieAnalysisSample[] = [],
    warnings: IAutoMovieAnalysisWarning[] = [],
  ): IAutoMovieValidation =>
    check({ outcome: { status: "solved", metrics, samples, warnings } });

  const sealed: IAutoMovieAnalysisRun = sealAutoMovieAnalysisRun({
    id: "hall-acoustics",
    domain: "acoustic",
    subject: "space:hall",
    inputRevision: "r7",
    solver: { id: "solver", version: "1", model: "Sabine" },
    settings: "volume=100",
    outcome: {
      status: "solved",
      metrics: [measured()],
      samples: [],
      warnings: [],
    },
  });
  const resealed: IAutoMovieAnalysisRun = sealAutoMovieAnalysisRun({
    id: "hall-acoustics",
    domain: "acoustic",
    subject: "space:hall",
    inputRevision: "r7",
    solver: { id: "solver", version: "1", model: "Sabine" },
    settings: "volume=100",
    outcome: {
      status: "solved",
      metrics: [measured()],
      samples: [],
      warnings: [],
    },
  });
  TestValidator.equals(
    "a sealed run validates, re-seals identically, and refuses every edit",
    {
      clean: validateAutoMovieAnalysisRun({ run: sealed }),
      stable: sealed.digest === resealed.digest,
      forgedSeal: hasViolation(
        validateAutoMovieAnalysisRun({
          run: { ...sealed, digest: digest("a") },
        }),
        "type",
        "$input.digest",
      ),
      forgedContents: hasViolation(
        validateAutoMovieAnalysisRun({
          run: {
            ...sealed,
            outcome: {
              status: "solved",
              metrics: [measured({ value: 0.4 })],
              samples: [],
              warnings: [],
            },
          },
        }),
        "type",
        "$input.digest",
      ),
      current: validateAutoMovieAnalysisRun({ run: sealed, revision: "r7" })
        .success,
      stale: hasViolation(
        validateAutoMovieAnalysisRun({ run: sealed, revision: "r8" }),
        "type",
        "$input.inputRevision",
      ),
      refusesInvalid: throwsError(
        (): IAutoMovieAnalysisRun =>
          sealAutoMovieAnalysisRun({
            id: "empty",
            domain: "acoustic",
            subject: "space:hall",
            inputRevision: "r7",
            solver: { id: "solver", version: "1", model: "Sabine" },
            settings: "none",
            outcome: {
              status: "solved",
              metrics: [],
              samples: [],
              warnings: [],
            },
          }),
        "at least one metric",
      ),
      knownDomain: isAutoMovieAnalysisDomain("thermal"),
      unknownDomain: isAutoMovieAnalysisDomain("structural"),
    },
    {
      clean: { success: true },
      stable: true,
      forgedSeal: true,
      forgedContents: true,
      current: true,
      stale: true,
      refusesInvalid: true,
      knownDomain: true,
      unknownDomain: false,
    },
  );

  // Each pair below holds the same characters in a different split between two
  // adjacent fields, so only a canonical text that delimits every field keeps
  // the two runs apart.
  TestValidator.equals(
    "moving a separator across a field boundary changes the run digest",
    {
      solver:
        autoMovieAnalysisRunDigest(
          draft({ solver: { id: "a|b", version: "1", model: "m" } }),
        ) !==
        autoMovieAnalysisRunDigest(
          draft({ solver: { id: "a", version: "b|1", model: "m" } }),
        ),
      header:
        autoMovieAnalysisRunDigest(
          draft({ subject: "space:hall\nr7", inputRevision: "r8" }),
        ) !==
        autoMovieAnalysisRunDigest(
          draft({ subject: "space:hall", inputRevision: "r7\nr8" }),
        ),
    },
    { solver: true, header: true },
  );
  return { digest, measured, draft, check, solved };
}
