import { sameProductData } from "./sameProductData";
import { autoMovieAnalysisMetric } from "../../../../packages/engine/src/analysis/autoMovieAnalysisMetric";
import { assertAutoMovieAnalysisTargets } from "../../../../packages/engine/src/analysis/assertAutoMovieAnalysisTargets";
import { summarizeAutoMovieAnalysis } from "../../../../packages/engine/src/analysis/summarizeAutoMovieAnalysis";
import type { IAutoMovieAnalysisMetric, IAutoMovieAnalysisRun, IAutoMovieAnalysisWarning, IAutoMovieAnalysisReport } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { sealedAnalysisRun } from "./analysisFixtures";
import { throwsError, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. the metric builder judges only what it can compare.
 * 2. the builder and the target table refuse what has no honest reading.
 *
 * Hand-authored complete metric records follow ordinary <= and >= comparisons: 0.8 meets an upper bound of 1 and a lower bound of 0.5, while 1.2/0.4 miss those bounds. Wrong units remove the target with a warning rather than convert it. Builder failures follow value/gap consistency and nonblank unique target keys, units and closed directions; this is not solver accuracy or hash certification.
 * Untargeted, both passing/failing directions, wrong unit, unrelated key and absent value compare full returned records with authored fixtures. Nonfinite values, value-plus-gap, absence-without-gap and malformed/duplicate target tables must throw; later parts own report folding.
 */
export function assertAnalysisRunContractPart5(measured: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric, draft: (overrides?: Partial<Omit<IAutoMovieAnalysisRun, "digest">>) => Omit<IAutoMovieAnalysisRun, "digest">, gap: { reason: string; remedy: string; }, warnings: IAutoMovieAnalysisWarning[], build: (value: number | null, targets: Parameters<typeof autoMovieAnalysisMetric>[0]["targets"], extra?: Partial<Parameters<typeof autoMovieAnalysisMetric>[0]>) => IAutoMovieAnalysisMetric): { run: (id: string, overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">>) => IAutoMovieAnalysisRun; clean: IAutoMovieAnalysisRun; report: IAutoMovieAnalysisReport; } {

  TestValidator.predicate("the metric builder judges only what it can compare", sameProductData({
      untargeted: build(0.8, []),
      meetsAtMost: build(0.8, [
        {
          key: "room.reverberationTime",
          unit: "s",
          value: 1,
          comparison: "at-most",
        },
      ]),
      missesAtMost: build(1.2, [
        {
          key: "room.reverberationTime",
          unit: "s",
          value: 1,
          comparison: "at-most",
        },
      ]),
      meetsAtLeast: build(0.8, [
        {
          key: "room.reverberationTime",
          unit: "s",
          value: 0.5,
          comparison: "at-least",
        },
      ]),
      missesAtLeast: build(0.4, [
        {
          key: "room.reverberationTime",
          unit: "s",
          value: 0.5,
          comparison: "at-least",
        },
      ]),
      wrongUnit: build(0.8, [
        {
          key: "room.reverberationTime",
          unit: "ms",
          value: 800,
          comparison: "at-most",
        },
      ]),
      otherKey: build(0.8, [
        { key: "room.constant", unit: "m2", value: 1, comparison: "at-least" },
      ]),
      absent: build(null, [], { gap, status: "unsupported" }),
      warnings,
    }, {
      untargeted: measured(),
      meetsAtMost: measured({
        target: 1,
        comparison: "at-most",
        status: "meets",
      }),
      missesAtMost: measured({
        value: 1.2,
        target: 1,
        comparison: "at-most",
        status: "misses",
      }),
      meetsAtLeast: measured({
        target: 0.5,
        comparison: "at-least",
        status: "meets",
      }),
      missesAtLeast: measured({
        value: 0.4,
        target: 0.5,
        comparison: "at-least",
        status: "misses",
      }),
      wrongUnit: measured(),
      otherKey: measured(),
      absent: measured({ value: null, status: "unsupported", gap }),
      warnings: [
        {
          code: "target-unit-mismatch",
          detail:
            'target for "room.reverberationTime" is declared in ms while the metric is measured in s; the target was ignored',
          subject: "room.reverberationTime",
        },
      ],
    }));
  TestValidator.equals(
    "the builder and the target table refuse what has no honest reading",
    namedFacts([
      [
        "absence with no reason",
        (): boolean => throwsError((): IAutoMovieAnalysisMetric => build(null, []), "must state why"),
      ],
      [
        "a value beside a gap",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisMetric => build(0.8, [], { gap }),
            "a measured metric has no gap",
          ),
      ],
      [
        "a non-finite value",
        (): boolean => throwsError((): IAutoMovieAnalysisMetric => build(Number.NaN, []), "finite value"),
      ],
      [
        "a blank target key",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisTargets([
                { key: " ", unit: "s", value: 1, comparison: "at-most" },
              ]),
            "non-blank metric key",
          ),
      ],
      [
        "a blank target unit",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisTargets([
                { key: "k", unit: "", value: 1, comparison: "at-most" },
              ]),
            "must state the unit",
          ),
      ],
      [
        "a non-finite target value",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisTargets([
                {
                  key: "k",
                  unit: "s",
                  value: Number.NaN,
                  comparison: "at-most",
                },
              ]),
            "finite value",
          ),
      ],
      [
        "an unknown direction",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisTargets([
                {
                  key: "k",
                  unit: "s",
                  value: 1,
                  comparison: "near" as unknown as "at-most",
                },
              ]),
            "at-least",
          ),
      ],
      [
        "a duplicated target",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisTargets([
                { key: "k", unit: "s", value: 1, comparison: "at-most" },
                { key: "k", unit: "s", value: 2, comparison: "at-most" },
              ]),
            "declared more than once",
          ),
      ],
    ]),
    {
      "absence with no reason": true,
      "a value beside a gap": true,
      "a non-finite value": true,
      "a blank target key": true,
      "a blank target unit": true,
      "a non-finite target value": true,
      "an unknown direction": true,
      "a duplicated target": true,
    },
  );

  const run: (id: string, overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">>) => IAutoMovieAnalysisRun = (
    id: string,
    overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
  ): IAutoMovieAnalysisRun => sealedAnalysisRun(draft({ id, ...overrides }));
  const clean: IAutoMovieAnalysisRun = run("clean", {
    outcome: {
      status: "solved",
      metrics: [
        measured({ status: "meets", target: 1, comparison: "at-most" }),
      ],
      samples: [],
      warnings: [],
    },
  });
  const report: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [clean],
    revision: "r7",
    required: ["acoustic"],
  });
  return { run, clean, report };
}
