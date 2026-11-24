import type { autoMovieAnalysisMetric } from "@automovie/engine";
import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisReport,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  IAutoMovieValidation,
} from "@automovie/interface";

import { assertAnalysisRunContractPart1 } from "../../../internal/assertAnalysisRunContractPart1";
import { assertAnalysisRunContractPart2 } from "../../../internal/assertAnalysisRunContractPart2";
import { assertAnalysisRunContractPart3 } from "../../../internal/assertAnalysisRunContractPart3";
import { assertAnalysisRunContractPart4 } from "../../../internal/assertAnalysisRunContractPart4";
import { assertAnalysisRunContractPart5 } from "../../../internal/assertAnalysisRunContractPart5";
import { assertAnalysisRunContractPart6 } from "../../../internal/assertAnalysisRunContractPart6";
import { assertAnalysisRunContractPart7 } from "../../../internal/assertAnalysisRunContractPart7";

/**
 * Seal and validate analysis artifacts, resolve metric targets and summarize required domains without confusing absence with a passing measurement.
 *
 * Scenarios:
 * 1. A sealed run validates and re-seals identically; the authored forged digest and changed metric with its original seal are refused.
 * 2. Identity fields have refusing twins: blank subject and revision, blank solver version and model, and a settings digest that is not one.
 * 3. A solved run with no metric is refused, and so is a duplicated metric key.
 * 4. A metric with no value must carry a reason and a remedy, must be `unsupported` or `not-run`, and may carry neither target nor comparison.
 * 5. A metric with a value may carry no gap, must not be `unsupported` or `not-run`, must carry both target and comparison when it judges, and must agree with its own comparison in both directions.
 * 6. A sample may only field a metric of the same run that produced a value; an unknown key, a gapped key, a duplicate id and an over-bound grid are each refused.
 * 7. Warnings must carry a nonblank code and detail, and a subject that is null or a nonblank string.
 * 8. The metric builder resolves declared targets in both directions, drops a target declared in the wrong unit with a warning rather than comparing across units, and refuses a value with a gap and a gap-less absence.
 * 9. Declared targets are refused at the door for a blank key, a blank unit and a duplicated key.
 * 10. A report is `meets` only when every required domain answered this revision, every metric produced a value and every target held; a miss, a stale run, an unsupported run, a not-run run, a gapped metric and an unanswered required domain each change that.
 * 11. The report bounds its gap list and counts the remainder, and refuses to exist over no required domain at all.
 * 12. Moving the authored newline or `|` between adjacent run identity fields or listed report gap fields changes the corresponding digest.
 */
export function test_unit_engine_analysis_run_contract(): void {
  const {
    digest,
    measured,
    draft,
    check,
    solved,
  }: {
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
  } = assertAnalysisRunContractPart1();
  const {
    gap,
    absent,
  }: {
    gap: { reason: string; remedy: string };
    absent: (
      overrides?: Partial<IAutoMovieAnalysisMetric>,
    ) => IAutoMovieAnalysisMetric;
  } = assertAnalysisRunContractPart2(measured, check, solved);
  const {
    at,
  }: {
    at: (id: string, key: string, value?: number) => IAutoMovieAnalysisSample;
  } = assertAnalysisRunContractPart3(measured, solved, gap, absent);
  const {
    warnings,
    build,
  }: {
    warnings: IAutoMovieAnalysisWarning[];
    build: (
      value: number | null,
      targets: Parameters<typeof autoMovieAnalysisMetric>[0]["targets"],
      extra?: Partial<Parameters<typeof autoMovieAnalysisMetric>[0]>,
    ) => IAutoMovieAnalysisMetric;
  } = assertAnalysisRunContractPart4(measured, solved, absent, at);
  const {
    run,
    clean,
    report,
  }: {
    run: (
      id: string,
      overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">>,
    ) => IAutoMovieAnalysisRun;
    clean: IAutoMovieAnalysisRun;
    report: IAutoMovieAnalysisReport;
  } = assertAnalysisRunContractPart5(measured, draft, gap, warnings, build);
  assertAnalysisRunContractPart6(measured, absent, run, clean, report);
  assertAnalysisRunContractPart7(digest, clean);
}
