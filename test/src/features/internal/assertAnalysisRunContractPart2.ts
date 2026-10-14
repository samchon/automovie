import type { IAutoMovieAnalysisMetric, IAutoMovieAnalysisRun, IAutoMovieAnalysisSample, IAutoMovieAnalysisWarning, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { hasViolation, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. every identity field of a run has a refusing twin.
 *
 * Schema version 1, the v1 protocol, known domains, nonblank identity/solver fields and SHA-256 spelling supply the literal refusal paths. A solved result requires a metric population and unique keys. Authored malformed records are deliberately resealed by the fixture so a digest mismatch cannot explain a contents failure.
 * Each identity field has its own changed twin; unknown outcome status, missing refusal reason/remedy, empty solved metrics, duplicate keys and blank metric keys/units are located faults beside the fully stated not-run result. The returned gap and absent-metric factory are inputs for Part3, which owns their value/status/target consistency.
 */
export function assertAnalysisRunContractPart2(measured: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric, check: (overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>) => IAutoMovieValidation, solved: (metrics: IAutoMovieAnalysisMetric[], samples?: IAutoMovieAnalysisSample[], warnings?: IAutoMovieAnalysisWarning[]) => IAutoMovieValidation): { gap: { reason: string; remedy: string; }; absent: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric; } {


  TestValidator.equals(
    "every identity field of a run has a refusing twin",
    namedFacts([
      [
        "version",
        (): boolean =>
          hasViolation(
            check({ version: 2 as unknown as 1 }),
            "type",
            "$input.version",
          ),
      ],
      [
        "protocol",
        (): boolean =>
          hasViolation(
            check({
              protocol:
                "automovie.analysis-run.v2" as unknown as IAutoMovieAnalysisRun["protocol"],
            }),
            "type",
            "$input.protocol",
          ),
      ],
      ["blank id", (): boolean => hasViolation(check({ id: " " }), "type", "$input.id")],
      [
        "blank subject",
        (): boolean => hasViolation(check({ subject: "" }), "type", "$input.subject"),
      ],
      [
        "blank revision",
        (): boolean =>
          hasViolation(
            check({ inputRevision: "  " }),
            "type",
            "$input.inputRevision",
          ),
      ],
      [
        "unknown domain",
        (): boolean =>
          hasViolation(
            check({
              domain:
                "structural" as unknown as IAutoMovieAnalysisRun["domain"],
            }),
            "type",
            "$input.domain",
          ),
      ],
      [
        "blank solver id",
        (): boolean =>
          hasViolation(
            check({ solver: { id: "", version: "1", model: "m" } }),
            "type",
            "$input.solver.id",
          ),
      ],
      [
        "blank solver version",
        (): boolean =>
          hasViolation(
            check({ solver: { id: "s", version: " ", model: "m" } }),
            "type",
            "$input.solver.version",
          ),
      ],
      [
        "blank solver model",
        (): boolean =>
          hasViolation(
            check({ solver: { id: "s", version: "1", model: "" } }),
            "type",
            "$input.solver.model",
          ),
      ],
      [
        "settings digest",
        (): boolean =>
          hasViolation(
            check({
              settings: "sha256:not-a-digest" as unknown as `sha256:${string}`,
            }),
            "type",
            "$input.settings",
          ),
      ],
      [
        "unknown outcome status",
        (): boolean =>
          hasViolation(
            check({
              outcome: {
                status: "pending",
              } as unknown as IAutoMovieAnalysisRun["outcome"],
            }),
            "type",
            "$input.outcome.status",
          ),
      ],
      [
        "unsupported without a reason",
        (): boolean =>
          hasViolation(
            check({
              outcome: {
                status: "unsupported",
                reason: " ",
                remedy: "bind one",
              },
            }),
            "type",
            "$input.outcome.reason",
          ),
      ],
      [
        "not-run without a remedy",
        (): boolean =>
          hasViolation(
            check({
              outcome: { status: "not-run", reason: "no input", remedy: "" },
            }),
            "type",
            "$input.outcome.remedy",
          ),
      ],
      [
        "not-run stated in full",
        (): boolean =>
          check({
            outcome: {
              status: "not-run",
              reason: "no exterior boundary condition",
              remedy: "declare the outdoor air temperature",
            },
          }).success,
      ],
      [
        "no metric at all",
        (): boolean => hasViolation(solved([]), "range", "$input.outcome.metrics"),
      ],
      [
        "duplicate metric key",
        (): boolean =>
          hasViolation(
            solved([measured(), measured({ value: 0.9 })]),
            "type",
            "$input.outcome.metrics[1].key",
          ),
      ],
      [
        "blank metric key",
        (): boolean =>
          hasViolation(
            solved([measured({ key: " " })]),
            "type",
            "$input.outcome.metrics[0].key",
          ),
      ],
      [
        "blank metric unit",
        (): boolean =>
          hasViolation(
            solved([measured({ unit: "" })]),
            "type",
            "$input.outcome.metrics[0].unit",
          ),
      ],
    ]),
    {
      version: true,
      protocol: true,
      "blank id": true,
      "blank subject": true,
      "blank revision": true,
      "unknown domain": true,
      "blank solver id": true,
      "blank solver version": true,
      "blank solver model": true,
      "settings digest": true,
      "unknown outcome status": true,
      "unsupported without a reason": true,
      "not-run without a remedy": true,
      "not-run stated in full": true,
      "no metric at all": true,
      "duplicate metric key": true,
      "blank metric key": true,
      "blank metric unit": true,
    },
  );

  const gap: { reason: string; remedy: string; } = { reason: "no solver", remedy: "bind one" };
  const absent: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric = (
    overrides: Partial<IAutoMovieAnalysisMetric> = {},
  ): IAutoMovieAnalysisMetric =>
    measured({ value: null, status: "not-run", gap, ...overrides });
  return { gap, absent };
}
