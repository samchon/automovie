import type { IAutoMovieAnalysisMetric, IAutoMovieAnalysisSample, IAutoMovieAnalysisWarning, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { hasViolation, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. an absent measurement must stay visibly absent.
 * 2. a measurement must agree with its own verdict.
 *
 * Absence requires an unsupported/not-run status, reason/remedy and no target/comparison; a finite measurement requires no gap and must agree with inclusive at-most/at-least bounds. The authored scalar comparisons and field paths determine verdicts without running a scientific solver.
 * Complete gaps contrast with claimed verdicts, missing/blank remedies and forbidden targets; measured values contrast with nonfinite values, inconsistent statuses, attached gaps, missing target/direction and nonfinite targets. Samples/warnings belong to Part4, and the parent separately rejects unknown comparison strings.
 */
export function assertAnalysisRunContractPart3(measured: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric, solved: (metrics: IAutoMovieAnalysisMetric[], samples?: IAutoMovieAnalysisSample[], warnings?: IAutoMovieAnalysisWarning[]) => IAutoMovieValidation, gap: { reason: string; remedy: string; }, absent: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric): { at: (id: string, key: string, value?: number) => IAutoMovieAnalysisSample; } {

  TestValidator.equals(
    "an absent measurement must stay visibly absent",
    namedFacts([
      ["not-run in full", (): boolean => solved([absent()]).success],
      [
        "unsupported in full",
        (): boolean => solved([absent({ status: "unsupported" })]).success,
      ],
      [
        "absent but claiming a verdict",
        (): boolean =>
          hasViolation(
            solved([absent({ status: "meets" })]),
            "type",
            "$input.outcome.metrics[0].status",
          ),
      ],
      [
        "absent with no gap",
        (): boolean =>
          hasViolation(
            solved([measured({ value: null, status: "not-run", gap: null })]),
            "type",
            "$input.outcome.metrics[0].gap",
          ),
      ],
      [
        "absent with a blank reason",
        (): boolean =>
          hasViolation(
            solved([absent({ gap: { reason: " ", remedy: "bind one" } })]),
            "type",
            "$input.outcome.metrics[0].gap.reason",
          ),
      ],
      [
        "absent with a blank remedy",
        (): boolean =>
          hasViolation(
            solved([absent({ gap: { reason: "no solver", remedy: "" } })]),
            "type",
            "$input.outcome.metrics[0].gap.remedy",
          ),
      ],
      [
        "absent with a target",
        (): boolean =>
          hasViolation(
            solved([absent({ target: 1 })]),
            "type",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "absent with a comparison",
        (): boolean =>
          hasViolation(
            solved([absent({ comparison: "at-most" })]),
            "type",
            "$input.outcome.metrics[0].comparison",
          ),
      ],
    ]),
    {
      "not-run in full": true,
      "unsupported in full": true,
      "absent but claiming a verdict": true,
      "absent with no gap": true,
      "absent with a blank reason": true,
      "absent with a blank remedy": true,
      "absent with a target": true,
      "absent with a comparison": true,
    },
  );

  TestValidator.equals(
    "a measurement must agree with its own verdict",
    namedFacts([
      [
        "non-finite value",
        (): boolean =>
          hasViolation(
            solved([measured({ value: Number.NaN })]),
            "range",
            "$input.outcome.metrics[0].value",
          ),
      ],
      [
        "value beside a gap",
        (): boolean =>
          hasViolation(
            solved([measured({ gap })]),
            "type",
            "$input.outcome.metrics[0].gap",
          ),
      ],
      [
        "untargeted with a target",
        (): boolean =>
          hasViolation(
            solved([measured({ target: 1 })]),
            "type",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "untargeted with a comparison",
        (): boolean =>
          hasViolation(
            solved([measured({ comparison: "at-most" })]),
            "type",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "value claiming to be unmeasured",
        (): boolean =>
          hasViolation(
            solved([measured({ status: "not-run", gap: null })]),
            "type",
            "$input.outcome.metrics[0].status",
          ),
      ],
      [
        "judging with no target",
        (): boolean =>
          hasViolation(
            solved([measured({ status: "meets", comparison: "at-most" })]),
            "type",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "judging with no comparison",
        (): boolean =>
          hasViolation(
            solved([measured({ status: "meets", target: 1 })]),
            "type",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "judging against a non-finite target",
        (): boolean =>
          hasViolation(
            solved([
              measured({
                status: "meets",
                target: Number.POSITIVE_INFINITY,
                comparison: "at-most",
              }),
            ]),
            "range",
            "$input.outcome.metrics[0].target",
          ),
      ],
      [
        "claiming to meet what it misses",
        (): boolean =>
          hasViolation(
            solved([
              measured({ status: "meets", target: 0.5, comparison: "at-most" }),
            ]),
            "type",
            "$input.outcome.metrics[0].status",
          ),
      ],
      [
        "claiming to miss what it meets",
        (): boolean =>
          hasViolation(
            solved([
              measured({ status: "misses", target: 1, comparison: "at-most" }),
            ]),
            "type",
            "$input.outcome.metrics[0].status",
          ),
      ],
      [
        "an honest at-most pass",
        (): boolean =>
          solved([
            measured({ status: "meets", target: 1, comparison: "at-most" }),
          ]).success,
      ],
      [
        "an honest at-least failure",
        (): boolean =>
          solved([
            measured({ status: "misses", target: 1, comparison: "at-least" }),
          ]).success,
      ],
    ]),
    {
      "non-finite value": true,
      "value beside a gap": true,
      "untargeted with a target": true,
      "untargeted with a comparison": true,
      "value claiming to be unmeasured": true,
      "judging with no target": true,
      "judging with no comparison": true,
      "judging against a non-finite target": true,
      "claiming to meet what it misses": true,
      "claiming to miss what it meets": true,
      "an honest at-most pass": true,
      "an honest at-least failure": true,
    },
  );

  const at: (id: string, key: string, value?: number) => IAutoMovieAnalysisSample = (
    id: string,
    key: string,
    value: number = 1,
  ): IAutoMovieAnalysisSample => ({
    id,
    key,
    position: { x: 0, y: 0, z: 0 },
    value,
  });
  return { at };
}
